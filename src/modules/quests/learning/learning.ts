import { EquipmentSlot, ItemStack, system } from '@minecraft/server'
import { ActionForm, ActionGuardOrder, location, Temporary, Vector } from 'lib'

import { MinecraftBlockTypes as b, MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { actionGuard } from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { Join } from 'lib/player-join'
import { Quest } from 'lib/quest/index'
import { Airdrop } from 'lib/rpg/airdrop'
import { createPublicGiveItemCommand, Menu } from 'lib/rpg/menu'

import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { form } from 'lib/form/new'
import { MineareaRegion } from 'lib/region/kinds/minearea'
import { Npc } from 'lib/rpg/npc'
import { Rewards } from 'lib/shop/rewards'
import { createLogger } from 'lib/utils/logger'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { OrePlace, ores } from 'modules/places/mineshaft/algo'
import { Spawn } from 'modules/places/spawn'
import { stoneQuarryInvestigating } from 'modules/places/stone-quarry/quests/investigating'
import { VillageOfMiners } from 'modules/places/village-of-miners/village-of-miners'
import airdropTable from './airdrop'

// TODO Write second quests for investigating other places
// TODO Add catscenes

const logger = createLogger('Learning Quest')

class Learning {
  id = 'learning'

  quest = new Quest('learning', 'Обучение', 'Обучение базовым механикам сервера', (q, player) => {
    if (!this.randomTeleportLocation.valid || !this.craftingTableLocation.valid)
      return q.failed('§cОбучение не настроено')

    q.counter((current, end) => `§6Добыто дерева: §f${current}/${end}`, 5)
      .description('Нарубите дерева')
      .activate((ctx, firstTime) => {
        if (firstTime) {
          // Delay code by one tick to prevent giving item
          // in spawn inventory that will be replaced with
          // anarchy
          system.delay(() => {
            this.startAxeGiveCommand.ensure(player)
            player.getComponent('equippable')?.setEquipment(EquipmentSlot.Offhand, Menu.itemStack)
          })
        }

        const trees = Object.values(MinecraftBlockTypes).filter(e => /log/i.exec(e)) as string[]

        ctx.world.afterEvents.playerBreakBlock.subscribe(({ player: ep, brokenBlockPermutation }) => {
          if (player.id !== ep.id) return
          if (!trees.includes(brokenBlockPermutation.type.id)) return

          logger.player(player).info`Mined ${brokenBlockPermutation.type.id}`

          player.playSound(Sounds.Success)
          ctx.diff(1)
        })
      })

    q.dynamic('§6Выйди под открытое небо')
      .description('Деревья могут помешать. Выйди туда, где над тобой будет только небо')
      .activate(ctx => {
        ctx.system.runInterval(
          () => {
            const hit = player.dimension.getBlockFromRay(
              player.location,
              { x: 0, y: 1, z: 0 },
              { includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 60 },
            )

            if (!hit) ctx.next()
          },
          'learning quest, free space detecter',
          20,
        )
      })

    q.dynamic('Залутай сундук, упавший с неба')
      .description('Забери все из упавшего с неба сундука')
      .activate((ctx, firstTime) => {
        if (!player.isValid) return

        function spawnAirdrop() {
          const airdrop = new Airdrop({ loot: airdropTable, forPlayerId: player.id })
          ctx.db = airdrop.id
          const position = Vector.add(player.location, { x: 0, y: 20, z: 0 })
          airdrop.spawn(position)
          return airdrop
        }

        function getAirdrop() {
          const airdrop = Airdrop.instances.find(e => e.id === ctx.db)
          if (!airdrop) {
            logger.player(player).warn`No airdrop found`
            return spawnAirdrop()
          }
          return airdrop
        }

        const airdrop = firstTime ? spawnAirdrop() : getAirdrop()

        ctx.world.afterEvents.playerInteractWithEntity.subscribe(event => {
          const airdropEntity = airdrop.chest
          if (!airdropEntity) return
          if (event.target.id !== airdropEntity.id) return

          if (player.id === event.player.id) ctx.system.delay(() => ctx.next())
        })

        ctx.world.afterEvents.entityDie.subscribe(event => {
          if (event.deadEntity.id !== airdrop.chest?.id) return
          ctx.system.delay(() => ctx.next())
        })

        let i = 0
        ctx.onInterval(() => {
          if (i === 1) {
            i = 0

            if (!airdrop.chest) {
              player.onScreenDisplay.setActionBar(
                '§cНе удалось найти аирдроп\nИспользуйте .wipe чтобы перепройти обучение',
                ActionbarPriority.Highest,
              )
            } else {
              ctx.place = airdrop.showParticleTrace()
              ctx.update()
            }
          } else i++
        })
      })

    const crafting = Vector.add(this.craftingTableLocation, { x: 0.5, y: 0.5, z: 0.5 })

    q.place(...Vector.around(crafting, 10), '§6Следуя компасу, доберитесь до верстака')

    q.item('§6Сделайте деревянную кирку')
      .description('Используя верстак сделайте деревянную кирку!')
      .isItem(item => item.typeId === MinecraftItemTypes.WoodenPickaxe)
      .place(crafting)

    q.break((i, end) => `§6Спуститесь в шахту и добудьте камня: §f${i}/${end}`, 10)
      .description('Отправляйтесь в шахту, найдите и накопайте камня.')
      .filter(broken => broken.type.id === b.Stone)
      .activate(ctx => {
        ctx.subscribe(OrePlace, () => true)
      })

    q.item('§6Сделайте каменную кирку')
      .description('Вернитесь к верстаку и улучшите свой инструмент.')
      .isItem(item => item.typeId === MinecraftItemTypes.StonePickaxe)
      .place(crafting)

    q.counter(i => (i === 0 ? `§6Вновь вскопайте камень в шахте §f0/1` : `§6Добыто железной руды: §f${i - 1}/3`), 3 + 1)
      .description('Вернитесь в шахту и вскопайте камень. Кажется, за ним прячется железо!')
      .activate(ctx => {
        // Force iron ore generation
        ctx.subscribe(
          OrePlace,
          ({ player, isDeepslate, possibleBlocks, place }) => {
            if (player.id !== ctx.player.id) return false

            ctx.db ??= { count: ctx.value }
            ;(ctx.db as { iron?: number }).iron ??= 0

            if ('iron' in ctx.db && typeof ctx.db.iron === 'number') {
              if (ctx.db.iron >= ctx.end - 1) return true

              for (const block of possibleBlocks) {
                if (ctx.db.iron >= ctx.end - 1) break
                if (place(block, isDeepslate ? b.DeepslateIronOre : b.IronOre)) {
                  ctx.db.iron++
                }
              }
              return true
            } else return false
          },
          10,
        )

        // Check if it breaks
        ctx.world.afterEvents.playerBreakBlock.subscribe(
          ({
            brokenBlockPermutation: {
              type: { id },
            },
            player,
          }) => {
            if (player.id !== player.id) return
            if (ctx.value === 0 ? id !== b.Stone : id !== b.IronOre && id !== MinecraftItemTypes.DeepslateIronOre)
              return

            player.playSound(Sounds.Success)
            ctx.diff(1)
          },
        )
      })

    q.dialogue(this.miner, 'Шахтер вас зовет!').body('Приветствую!').buttons()
  })

  randomTeleportLocation = location(this.quest.group.point('tp').name('Куда игроки будут тепаться при обучении'))

  craftingTableLocation = location(this.quest.group.point('crafting table').name('Верстак'))

  startAxe = new ItemStack(MinecraftItemTypes.WoodenAxe).setInfo('§r§6Начальный топор', 'Начальный топор')

  startAxeGiveCommand = createPublicGiveItemCommand('startwand', this.startAxe)

  minearea: MineareaRegion | undefined

  miner = new Npc(this.quest.group.point('miner').name('Шахтер'), ({ player }) => {
    form(f => {
      f.title(this.miner.name)
      f.quest(stoneQuarryInvestigating.quest, 'Где мне переплавить железо?')
      f.quest(this.mine10Iron, 'Где добыть еще больше железа?')
      f.quest(this.mine10Coal, 'Где добыть угля?')
      f.quest(this.mine10Diamonds, 'Где добыть алмазы?')
    }).show(player)
    return true
  })

  createMineQuest(id: string, text: string, amount: number, itemTypes: string[], rewards: Rewards) {
    return new Quest(id, text, 'Да', q => {
      q.break((c, end) => `${c}/${end}`, amount).filter(({ type: { id } }) => itemTypes.includes(id))

      const reward = q.button().reward(rewards)
      if (this.miner.location.valid) reward.place(this.miner.location)
    })
  }

  mine10Iron = this.createMineQuest(
    'mine-10-iron',
    'Добыть железо',
    10,
    [b.IronOre, b.DeepslateIronOre],
    new Rewards().money(600),
  )

  mine10Coal = this.createMineQuest(
    'mine-10-coal',
    'Добыть уголь',
    10,
    [b.CoalOre, b.DeepslateCoalOre],
    new Rewards().money(400),
  )

  mine10Diamonds = this.createMineQuest(
    'mine-10-diamonds',
    'Добыть алмазы',
    10,
    [b.DiamondOre, b.DeepslateDiamondOre],
    new Rewards().money(1000),
  )

  blockedOre = new WeakPlayerMap<string[]>()

  constructor() {
    actionGuard((player, region, ctx) => {
      if (ctx.type !== 'break') return
      if (ctx.event.dimension.type !== 'overworld') return
      if ([...this.blockedOre.values()].flat().includes(Vector.string(ctx.event.block))) {
        player.fail('Вы не можете ломать руду новичка.')
        return false
      }

      if (region !== VillageOfMiners.safeArea) return
      if (this.quest.getPlayerStep(player)) {
        const isOre =
          ores.isOre(ctx.event.block.typeId) ||
          (
            [
              MinecraftBlockTypes.Stone,
              MinecraftBlockTypes.Andesite,
              MinecraftBlockTypes.Diorite,
              MinecraftBlockTypes.Granite,
              MinecraftBlockTypes.Deepslate,
            ] as string[]
          ).includes(ctx.event.block.typeId)
        system.delay(() => {
          if (isOre) {
            player.fail('Блоки можно ломать только глубоко в шахте!')
          } else {
            player.fail('В мирной зоне ломать блоки запрещено.')
          }
        })
      }
    }, ActionGuardOrder.Permission)

    Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (player.database.role === 'spectator') {
        player.info(
          '§fСервер еще не готов. Если вы хотите стать строителем или тестером - подайте заявку на нашем дискорд сервере: §bdsc.gg/lushway§f, а пока вы можете только наблюдать.',
        )
      }
    })

    Anarchy.learningRTP = async player => {
      if (!this.randomTeleportLocation.valid) {
        player.fail('Случайное перемещение не настроено')
        Spawn.portal?.teleport(player)
        delete player.database.survival.anarchy
        return
      }

      const temp = new Temporary(({ system }) => {
        system.runInterval(
          () => {
            if (player.database.inv !== 'anarchy') return temp.cleanup()

            player.camera.fade({
              fadeColor: { blue: 0, green: 0, red: 0 },
              fadeTime: { fadeInTime: 0, holdTime: 2, fadeOutTime: 2 },
            })
          },
          'asdada',
          20,
        )
      })

      logger.info`Teleporting to ${this.randomTeleportLocation}`
      player.database.survival.doNotSaveAnarchy = 1
      player.teleport(this.randomTeleportLocation)

      return new Promise(resolve => {
        const back = () => {
          delete player.database.survival.anarchy
          Spawn.portal?.teleport(player)
        }
        new ActionForm(
          'Режим Анархия',
          'Ты - выживший, ты мало что умеешь, и просто так рубить блоки не можешь, да. Следуй по компасу.',
        )
          .addButton('Вперед!', () => {
            if (!this.randomTeleportLocation.valid) return

            delete player.database.survival.doNotSaveAnarchy
            temp.cleanup()
            resolve()
            this.quest.enter(player)
          })
          .addButtonBack(back)
          .show(player)
          .then(e => !e && back())
      })
    }
  }
}

new Learning()
