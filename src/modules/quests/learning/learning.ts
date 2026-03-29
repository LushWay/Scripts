import { EquipmentSlot, ItemStack, system, world } from '@minecraft/server'

import { MinecraftBlockTypes as b, MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'

import { Sounds } from 'lib/assets/custom-sounds'
import { Join } from 'lib/player-join'
import { Quest } from 'lib/quest/index'
import { Airdrop } from 'lib/rpg/airdrop'
import { createPublicGiveItemCommand, Menu } from 'lib/rpg/menu'

import { Items } from 'lib/assets/custom-items'
import { Cutscene } from 'lib/cutscene'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { ActionForm } from 'lib/form/action'
import { i18n, i18nShared, noI18n } from 'lib/i18n/text'
import { location } from 'lib/location'
import { actionGuard, ActionGuardOrder, Region } from 'lib/region'
import { RegionEvents } from 'lib/region/events'
import { MineareaRegion } from 'lib/region/kinds/minearea'
import { enterNewbieMode } from 'lib/rpg/newbie'
import { noGroup } from 'lib/rpg/place'
import { Temporary } from 'lib/temporary'
import { onLoad } from 'lib/utils/load-ref'
import { createLogger } from 'lib/utils/logger'
import { createPointVec } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { WeakPlayerMap, WeakPlayerSet } from 'lib/weak-player-storage'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { OrePlace, ores } from 'modules/places/mineshaft/algo'
import { Spawn } from 'modules/places/spawn'
import { VillageOfMiners } from 'modules/places/village-of-miners/village-of-miners'
import airdropTable from './airdrop'

const logger = createLogger('Learning Quest')

class Learning {
  id = 'learning'

  quest = new Quest(
    noGroup.place('learning').name(i18nShared`Обучение`),
    i18n`Обучение базовым механикам сервера`,
    (q, player) => {
      if (!this.learningLocation.valid || !this.craftingTableLocation.valid)
        return q.failed(noI18n`Learning is not setup properly`)

      const maxReturnToAreaSteps = 5
      const returnToMineArea = (step: number) => () => {
        // Fix to those who had joined and been AFK, newbie expired and they can't leave quest because
        // they can only mine in newbie mode
        enterNewbieMode(player, false)

        if (player.database.inv !== 'anarchy' || Spawn.region?.area.isIn(player)) return

        const regions = MineareaRegion.getManyAt(player)
        if (!regions.length) {
          player.fail(
            i18n.error`Вы не можете покинуть зону добычи, пока не завершили задания ${step}/${maxReturnToAreaSteps}`,
          )
          this.learningLocation.teleport(player)
        }
      }

      q.counter((current, end) => i18n.header`Добыто дерева: ${current}/${end}`, 5)
        .description(i18n`Нарубите дерева`)
        .activate((ctx, firstTime) => {
          ctx.onInterval(returnToMineArea(1))

          if (firstTime) {
            // Delay code by one tick to prevent giving item
            // in spawn inventory that will be replaced with
            // anarchy
            system.delay(() => {
              this.startAxeGiveCommand.value.ensure(player)
              player.getComponent('equippable')?.setEquipment(EquipmentSlot.Offhand, Menu.itemStack.value)
            })
          }

          const trees = Object.values(MinecraftBlockTypes).filter(e => /log/i.exec(e)) as string[]

          ctx.world.afterEvents.playerBreakBlock.subscribe(({ player: ep, brokenBlockPermutation }) => {
            if (player.id !== ep.id) return
            if (!trees.includes(brokenBlockPermutation.type.id)) return

            logger.player(player).info`Mined ${brokenBlockPermutation.type.id}`

            player.playSound(Sounds.Success)
            ctx.add(1)
          })
        })

      q.dynamic(i18n.header`Выйди под открытое небо`)
        .description(i18n`Деревья могут помешать. Выйди туда, где над тобой будет только небо`)
        .activate(ctx => {
          ctx.onInterval(returnToMineArea(2))

          ctx.system.runInterval(
            () => {
              const hit = player.dimension.getBlockFromRay(
                player.location,
                { x: 0, y: 1, z: 0 },
                {
                  includeLiquidBlocks: true,
                  includePassableBlocks: true,
                  maxDistance: 60,
                },
              )

              if (!hit) ctx.next()
            },
            'learning quest, free space detecter',
            20,
          )
        })

      q.dynamic(i18n`Заберите все из сундука, упавшего с неба`)
        .description(i18n`Заберите все из упавшего с неба сундука. На него указывает компас`)
        .activate((ctx, firstTime) => {
          ctx.onInterval(returnToMineArea(3))

          if (!player.isValid) return

          function spawnAirdrop() {
            const airdrop = new Airdrop({
              loot: airdropTable,
              forPlayerId: player.id,
            })
            ctx.db = airdrop.id
            const position = Vec.add(player.location, { x: 0, y: 20, z: 0 })
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

          // ctx.world.afterEvents.playerInteractWithEntity.subscribe(event => {
          //   const airdropEntity = airdrop.chest
          //   if (!airdropEntity) return
          //   if (event.target.id !== airdropEntity.id) return

          //   if (player.id === event.player.id) ctx.system.delay(() => ctx.next())
          // })

          ctx.world.afterEvents.entityRemove.subscribe(event => {
            if (event.removedEntityId === airdrop.chest?.id) ctx.system.delay(() => ctx.next())
          })

          let i = 0
          ctx.onInterval(() => {
            if (i === 1) {
              i = 0

              if (!airdrop.chest) {
                player.onScreenDisplay.setActionBar(
                  i18n.error`Не удалось найти аирдроп\nИспользуйте .wipe чтобы перепройти обучение`.to(player.lang),
                  ActionbarPriority.High,
                )
              } else {
                ctx.target = airdrop.showParticleTrace()
                ctx.update()
              }
            } else i++
          })
        })

      q.dynamic(i18n`Используй монеты в инвентаре`)
        .description(i18n`Возьми в руки монеты из инвентаря и используй, чтобы добавить на свой счет`)
        .activate(ctx => {
          const money = ctx.player.container?.find(new ItemStack(Items.Money))
          if (typeof money !== 'number') return ctx.next()

          ctx.world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
            if (source.id !== ctx.player.id || itemStack.typeId !== Items.Money) return

            ctx.next()
          })
        })

      const crafting = createPointVec(
        Vec.add(this.craftingTableLocation, { x: 0.5, y: 0.5, z: 0.5 }),
        this.craftingTableLocation.dimensionType,
      )

      q.reachArea(
        ...Vec.around(crafting.location, 10),
        i18n.header`Следуя компасу, доберитесь до верстака`,
        crafting.dimensionType,
      )

      q.item(i18n.header`Сделайте деревянную кирку`)
        .description(i18n`Используя верстак сделайте деревянную кирку!`)
        .isItem(item => item.typeId === MinecraftItemTypes.WoodenPickaxe)
        .target(crafting)

      q.breakCounter((i, end) => i18n.header`Спуститесь в шахту и добудьте камня: ${i}/${end}`, 10)
        .description(i18n`Отправляйтесь в шахту, найдите и накопайте камня.`)
        .filter(broken => broken.type.id === b.Stone)
        .activate(ctx => {
          ctx.subscribe(OrePlace, () => true)
        })

      q.item(i18n.header`Сделайте каменную кирку`)
        .description(i18n`Вернитесь к верстаку и улучшите свой инструмент.`)
        .isItem(item => item.typeId === MinecraftItemTypes.StonePickaxe)
        .target(crafting)

      q.cutscene(this.noOresCutscene, i18n.header`На поверхности руд нет`)

      q.cutscene(this.minerCutscene, i18n.header`Попробуйте копнуть поглубже`)

      q.counter(i => i18n.header`Добыто железной руды: ${i}/${3}`, 3)
        .description(i18n`Вернитесь в шахту и вскопайте камень. Кажется, за ним прячется железо!`)
        .activate(ctx => {
          // Force iron ore generation
          ctx.subscribe(
            OrePlace,
            ({ player, isDeepslate, possibleBlocks, place }) => {
              if (player.id !== ctx.player.id) return false

              ctx.db ??= { count: ctx.value }
              ;(ctx.db as { iron?: number }).iron ??= 0

              if ('iron' in ctx.db && typeof ctx.db.iron === 'number') {
                if (ctx.db.iron >= ctx.end) return true

                for (const block of possibleBlocks) {
                  if (ctx.db.iron >= ctx.end) break
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
          ctx.world.afterEvents.playerBreakBlock.subscribe(({ brokenBlockPermutation, player }) => {
            if (player.id !== player.id) return

            const id = brokenBlockPermutation.type.id
            if (id !== b.IronOre && id !== MinecraftItemTypes.DeepslateIronOre) return

            player.playSound(Sounds.Success)
            ctx.add(1)
          })
        })

      q.dialogue(VillageOfMiners.guide, i18n`Шахтер зовет вас наверх, чтобы поговорить!`)
    },
  )

  learningLocation = location(this.quest.group.place('tp').name(noI18n`Куда игроки будут тепаться при обучении`))

  noOresCutscene = new Cutscene('learningNoOres', 'noOres', { restoreCameraTime: 0 })

  minerCutscene = new Cutscene('learningMiner', 'miner')

  craftingTableLocation = location(this.quest.group.place('crafting table').name(noI18n`Верстак`))

  startAxeGiveCommand = onLoad(() =>
    createPublicGiveItemCommand(
      'startwand',
      new ItemStack(MinecraftItemTypes.WoodenAxe),
      s => s.typeId === MinecraftItemTypes.WoodenAxe && s.getDynamicProperty('startwand') === true,
      i18n`§r§6Начальный топор`,
    ),
  )

  blockedOre = new WeakPlayerMap<string[]>()

  regions: Region[] = []

  constructor() {
    RegionEvents.onLoad.subscribe(() => {
      this.learningLocation.onLoad.subscribe(location => {
        for (const region of MineareaRegion.getNear(location.toPoint(), 25)) {
          region.newbie = true
          region.permissions.pvp = false
          this.regions.push(region)
        }
      })
    })

    system.runInterval(() => {
      if (!this.learningLocation.valid) return
      world[this.learningLocation.dimensionType]
        .getEntities({ location: this.learningLocation, maxDistance: 25 })
        .forEach(e => {
          if (!e.nameTag) e.remove()
        })
    }, 'clear learning monsters')

    actionGuard((player, region, ctx) => {
      if (ctx.type !== 'break') return
      if (ctx.event.dimension.type !== 'overworld') return
      if ([...this.blockedOre.values()].flat().includes(Vec.string(ctx.event.block))) {
        player.fail(i18n.error`Вы не можете ломать руду новичка.`)
        return false
      }

      if (region !== VillageOfMiners.safeArea) return
      if (this.quest.getCurrentStep(player)) {
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
            player.fail(i18n.error`Блоки можно ломать только глубоко в шахте!`)
          } else {
            player.fail(i18n.error`В мирной зоне ломать блоки запрещено.`)
          }
        })
      }
    }, ActionGuardOrder.Permission)

    Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (player.database.role === 'spectator') {
        player.info(
          noI18n`§fСервер еще не готов. Если вы хотите стать строителем или тестером - подайте заявку на нашем дискорд сервере: §bdsc.gg/lushway§f, а пока вы можете только наблюдать.`,
        )
      }
    })

    const sent = new WeakPlayerSet()

    Anarchy.enterLearning = async player => {
      if (sent.has(player)) return false

      const toSpawn = () => (temp.cleanup(), Spawn.portal?.teleport(player))
      if (!this.learningLocation.valid)
        return (toSpawn(), player.fail(noI18n.error`Learning is not setup properly (1)`), false)

      const temp = new Temporary(ctx => {
        const fadeCamera = () => {
          player.camera.fade({
            fadeColor: { blue: 0, green: 0, red: 0 },
            fadeTime: { fadeInTime: 0.5, holdTime: 0.5, fadeOutTime: 1 },
          })
        }

        fadeCamera()

        ctx.system.runInterval(fadeCamera, 'anarchy learning screen fade', 10)
      })

      logger.player(player).info`Open rebith form`

      return new Promise<boolean>(resolve => {
        sent.add(player)
        new ActionForm(
          i18n`Режим Перерождение`.to(player.lang),
          i18n`Ты - выживший после апокалипсиса, которого выкинуло на берег. Ты мало чего умеешь, не можешь ломать блоки где попало и все что остается - следовать указаниям над инвентарем, следовать компасу и алмазу на миникарте.`.to(
            player.lang,
          ),
        )
          .button(i18n`Вперед!`.to(player.lang), () => {
            if (!this.learningLocation.valid) return

            logger.player(player).info`Teleporting to ${this.learningLocation}`
            resolve(true)
            system.delay(() => {
              if (!this.learningLocation.valid) return
              player.teleport(this.learningLocation)
              temp.cleanup()
              this.quest.enter(player)
            })
          })
          .addButtonBack(toSpawn, player.lang)
          .show(player)
          .then(shown => (shown && toSpawn(), false))
          .finally(() => sent.delete(player))
      })
    }
  }
}

export const learningQuest = new Learning()
