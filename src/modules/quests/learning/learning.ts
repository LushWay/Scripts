import { ItemStack, system } from '@minecraft/server'
import { ActionForm, location, Temporary, Vector } from 'lib'

import { MinecraftBlockTypes as b, MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { actionGuard, SafeAreaRegion } from 'lib'
import { Sounds } from 'lib/assets/config'
import { Join } from 'lib/player-join'
import { Quest } from 'lib/quest/index'
import { Airdrop } from 'lib/rpg/airdrop'
import { createPublicGiveItemCommand, Menu } from 'lib/rpg/menu'

import { t } from 'lib/text'
import { Axe } from 'modules/features/axe'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { Jeweler } from 'modules/places/lib/npc/jeweler'
import { OrePlace, ores } from 'modules/places/mineshaft/algo'
import { Spawn } from 'modules/places/spawn'
import { stoneQuarryInvestigating } from 'modules/places/stone-quarry/quests/investigating'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'
import { VillageOfMiners } from 'modules/places/village-of-miners/village-of-miners'
import airdropTable from './airdrop'

// TODO Write second quests for investigating other places
// TODO Add catscenes

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
            player.container?.setItem(8, Menu.itemStack)
          })
        }

        ctx.world.afterEvents.playerBreakBlock.subscribe(({ player: ep, brokenBlockPermutation }) => {
          if (player.id !== ep.id) return
          if (!Axe.breaks.includes(brokenBlockPermutation.type.id)) return

          player.log('mined', brokenBlockPermutation.type.id)

          player.playSound(Sounds.Action)
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
        if (!player.isValid()) return

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
            ctx.player.log(ctx.quest.id, t.error`No airdrop found`)
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

    q.counter((i, end) => `§6Добыто камня: §f${i}/${end}`, 10)
      .description('Отправляйтесь в шахту, найдите и накопайте камня.')
      .activate(ctx => {
        ctx.subscribe(OrePlace, () => true)

        ctx.world.afterEvents.playerBreakBlock.subscribe(event => {
          if (event.player.id !== player.id) return
          if (event.brokenBlockPermutation.type.id !== b.Stone) return

          player.playSound(Sounds.Action)
          ctx.diff(1)
        })
      })

    q.item('§6Сделайте каменную кирку')
      .description('Вернитесь к верстаку и улучшите свой инструмент.')
      .isItem(item => item.typeId === MinecraftItemTypes.StonePickaxe)
      .place(crafting)

    q.counter((i, end) => `§6Добыто железной руды: §f${i}/${end}`, 5)
      .description('Вернитесь в шахту и вскопайте камень. Кажется, за ним прячется железо!')
      .activate(ctx => {
        // Force iron ore generation
        ctx.subscribe(OrePlace, ({ player, isDeepslate, possibleBlocks, place }) => {
          if (player.id !== player.id) return false

          ctx.db ??= { count: ctx.value }
          ;(ctx.db as { iron?: number }).iron ??= 0

          if ('iron' in ctx.db && typeof ctx.db.iron === 'number') {
            if (ctx.db.iron >= ctx.end) return false

            for (const block of possibleBlocks) {
              if (ctx.db.iron >= ctx.end) break
              place(block, isDeepslate ? b.DeepslateIronOre : b.IronOre)
              ctx.db.iron++
            }
            return true
          }

          return false
        })

        // Check if it breaks
        ctx.world.afterEvents.playerBreakBlock.subscribe(({ brokenBlockPermutation, player }) => {
          if (player.id !== player.id) return
          if (
            brokenBlockPermutation.type.id !== b.IronOre &&
            brokenBlockPermutation.type.id !== MinecraftItemTypes.DeepslateIronOre
          )
            return

          player.playSound(Sounds.Action)
          ctx.diff(1)
        })
      })

    q.dialogue(this.miner.npc, 'Узнайте что дальше у Шахтера')
      .body('Приветствую!')
      .buttons(
        [
          'Где мне переплавить железо?',
          (ctx, back) => {
            new ActionForm(this.miner.npc.name, `В месте, которое называется ${StoneQuarry.name}`)
              .addButtonBack(back)
              .addButton('Я хочу туда!', () => {
                ctx.next()
                stoneQuarryInvestigating.quest.enter(player)
              })
              .show(player)
          },
        ],
        ['Где я?', (ctx, back) => new ActionForm(this.miner.npc.name, 'Хз').addButtonBack(back).show(player)],
        ['Кто я?', (ctx, back) => new ActionForm(this.miner.npc.name, 'Хз').addButtonBack(back).show(player)],
        ['Кто ты?', (ctx, back) => new ActionForm(this.miner.npc.name, 'Хз').addButtonBack(back).show(player)],
      )
  })

  randomTeleportLocation = location(this.quest.group.point('tp').name('Куда игроки будут тепаться при обучении'))

  craftingTableLocation = location(this.quest.group.point('crafting table').name('Верстак'))

  startAxe = new ItemStack(MinecraftItemTypes.WoodenAxe).setInfo('§r§6Начальный топор', 'Начальный топор')

  startAxeGiveCommand = createPublicGiveItemCommand('startwand', this.startAxe)

  safeArea: SafeAreaRegion | undefined = void 0

  miner = new Jeweler(this.quest.group, this.quest.group.point('miner').name('Шахтер'))

  constructor() {
    actionGuard((player, region, ctx) => {
      if (ctx.type !== 'break') return
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
    })

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
              fadeTime: { fadeInTime: 0, holdTime: 3, fadeOutTime: 2 },
            })
          },
          'asdada',
          20,
        )
      })

      console.log('Teleporting to', Vector.string(this.randomTeleportLocation))
      player.teleport(this.randomTeleportLocation)

      return new Promise(resolve => {
        new ActionForm(
          'Заметка',
          'Ты - выживший, ты мало что умеешь, и просто так рубить блоки не можешь, да. Следуй по компасу.',
        )
          .addButton('Понятно', () => {
            player.camera.fade({ fadeTime: { fadeInTime: 0, holdTime: 0, fadeOutTime: 2 } })
            if (!this.randomTeleportLocation.valid) return

            temp.cleanup()
            resolve()
            this.quest.enter(player)
          })
          .show(player)
      })
    }
  }
}

new Learning()
