import { ItemStack, Vector, system } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { EditableLocation, SafeAreaRegion, Temporary, actionGuard } from 'lib.js'
import { SOUNDS } from 'lib/Assets/config.js'
import { Menu, createPublicGiveItemCommand } from 'lib/Menu.js'
import { Join } from 'lib/PlayerJoin.js'
import { Axe } from 'modules/Features/axe.js'
import { randomTeleport } from 'modules/Features/randomTeleport.js'
import { Anarchy } from 'modules/Places/Anarchy.js'
import { Spawn } from 'modules/Places/Spawn.js'
import { VillageOfMiners } from 'modules/Places/VillageOfMiners.js'
import { Quest } from 'modules/Quests/lib/Quest.js'
import airdropTable from './airdrop.js'

// TODO Add even more steps,
// TODO Write second quests for investigating other places
// TODO Add catscenes

export class Learning {
  static quest = new Quest(
    { name: 'Обучение', desc: 'Обучение базовым механикам сервера', id: 'learning' },
    (q, player) => {
      if (
        !Anarchy.portal ||
        !Anarchy.portal.from ||
        !Anarchy.portal.to ||
        !Learning.randomTeleportLocation.valid ||
        !Learning.craftingTableLocation.valid
      )
        return q.failed('§cОбучение или сервер не настроены')

      q.place(Anarchy.portal.from, Anarchy.portal.to, '§6Зайди в портал анархии')

      q.counter({
        end: 5,
        text(value) {
          return `§6Наруби §f${value}/${this.end} §6блоков дерева`
        },
        activate(firstTime) {
          if (firstTime) {
            // Delay code by one tick to prevent giving item
            // in spawn inventory that will be replaced with
            // anarchy
            system.delay(() => {
              Learning.startAxeGiveCommand?.ensure(this.player)
              const { container } = this.player
              if (!container) return

              const slot = container.getSlot(8)
              slot.setItem(Menu.item)
            })
          }

          return new Temporary(({ world }) => {
            world.afterEvents.playerBreakBlock.subscribe(({ player, brokenBlockPermutation }) => {
              if (player.id !== this.player.id) return
              if (!Axe.breaks.includes(brokenBlockPermutation.type.id)) return

              console.debug(`${player.name} brock ${brokenBlockPermutation.type.id}`)

              this.player.playSound(SOUNDS.action)
              this.diff(1)
            })
          })
        },
      })

      q.dynamic({
        text: '§6Выйди под открытое небо',
        description: 'Деревья могут помешать. Выйди туда, где над тобой будет только небо',
        activate() {
          return new Temporary(({ system }) => {
            system.runInterval(
              () => {
                const hit = this.player.dimension.getBlockFromRay(
                  this.player.location,
                  { x: 0, y: 1, z: 0 },
                  { includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 60 },
                )

                if (hit) {
                  this.player.onScreenDisplay.setActionBar('§6Выйди под открытое небо!')
                } else {
                  this.player.onScreenDisplay.setActionBar('')
                  this.player.success('Посмотри наверх!')
                  this.next()
                }
              },
              'learning quest, free space detecter',
              20,
            )
          })
        },
      })

      q.airdrop({
        lootTable: airdropTable,
        abovePlayerY: 20,
      })

      /** @param {string} text */
      const craftingTable = text =>
        Learning.craftingTableLocation.valid &&
        q.dynamic({
          text: '§6Используй верстак на\n' + Vector.string(Learning.craftingTableLocation, true),
          description: text,
          activate() {
            return new Temporary(({ temp, world }) => {
              if (!Learning.craftingTableLocation.valid) return
              Learning.quest.steps(this.player).targetCompassTo({
                place: Vector.add(Learning.craftingTableLocation, { x: 0.5, y: 0.5, z: 0.5 }),
                temporary: temp,
              })

              world.afterEvents.playerInteractWithBlock.subscribe(event => {
                if (event.player.id !== this.player.id) return
                if (!Learning.craftingTableLocation.valid) return
                if (Vector.string(event.block.location) !== Vector.string(Learning.craftingTableLocation)) return

                this.next()
              })
            })
          },
        })

      craftingTable('Доберитеcь до верстака, чтобы скрафтить кирку.')

      q.item({
        text: () => '§6Сделайте деревянную кирку',
        description: 'Чтобы пойти в шахту, нужна кирка. Сделайте ее!',
        isItem: item => item.typeId === MinecraftItemTypes.WoodenPickaxe,
      })

      q.counter({
        end: 10,
        text(i) {
          return `§6Накопайте §f${i}/${this.end}§6 камня`
        },
        description: () => 'Отправляйтесь в шахту, найдите и накопайте камня.',
        activate() {
          return new Temporary(({ world }) => {
            world.afterEvents.playerBreakBlock.subscribe(event => {
              if (event.player.id !== this.player.id) return
              if (event.brokenBlockPermutation.type.id !== MinecraftBlockTypes.Stone) return

              this.player.playSound(SOUNDS.action)
              this.diff(1)
            })
          })
        },
      })

      craftingTable('Доберитеcь до верстака, чтобы сделать каменную кирку.')

      q.item({
        text: () => '§6Сделайте каменную кирку',
        description: 'Сделайте каменную кирку. Время улучшить инструмент!',
        isItem: item => item.typeId === MinecraftItemTypes.StonePickaxe,
      })

      q.counter({
        end: 5,
        text(i) {
          return `§6Накопайте §f${i}/${this.end}§6 железа`
        },
        description: () => 'Отправляйтесь в шахту, найдите и накопайте железа!',
        activate() {
          return new Temporary(({ world }) => {
            world.afterEvents.playerBreakBlock.subscribe(event => {
              if (event.player.id !== this.player.id) return
              if (
                event.brokenBlockPermutation.type.id !== MinecraftBlockTypes.IronOre &&
                event.brokenBlockPermutation.type.id !== MinecraftItemTypes.DeepslateIronOre
              )
                return

              this.player.playSound(SOUNDS.action)
              this.diff(1)
            })
          })
        },
      })

      q.end(function () {
        this.player.success(
          '§6Обучение закончено!\nВы можете пойти в каменоломню чтобы переплавить железо или продолжить добывавать новые ресурсы в шахте.',
        )
      })
    },
  )

  static randomTeleportLocation = new EditableLocation('learning_quest_rtp', { type: 'vector3+radius' }).safe

  static craftingTableLocation = new EditableLocation('learning_quest_crafting_table').safe

  static startAxe = new ItemStack(MinecraftItemTypes.WoodenAxe).setInfo('§r§6Начальный топор', 'Начальный топор')

  static startAxeGiveCommand = createPublicGiveItemCommand('startwand', this.startAxe)

  /** @type {SafeAreaRegion | undefined} */
  static safeArea = void 0
}

actionGuard((player, region, ctx) => {
  if (ctx.type !== 'break') return
  if (region !== VillageOfMiners.safeArea) return
  if (Learning.quest.current(player)) {
    system.delay(() => {
      player.fail('Блоки можно ломать только глубже в шахте!')
    })
  }
})

Learning.randomTeleportLocation.onLoad.subscribe(location => {
  Learning.safeArea = new SafeAreaRegion({
    permissions: { allowedEntities: 'all' },
    center: location,
    radius: location.radius * 5,
    dimensionId: 'overworld',
  })

  Axe.allowBreakInRegions.push(Learning.safeArea)
})

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (player.database.role === 'spectator') {
    player.info(
      '§fСервер еще не готов. Если вы хотите стать строителем или тестером - подайте заявку на нашем дискорд сервере: §bdsc.gg/lushway§f, а пока вы можете только наблюдать.',
    )
  } else if (firstJoin) Learning.quest.enter(player)
})

Anarchy.learningRTP = player => {
  if (!Learning.randomTeleportLocation.valid) {
    player.fail('Случайное перемещение не настроено')
    Spawn.portal?.teleport(player)
    delete player.database.survival.anarchy
    return
  }

  const location = Learning.randomTeleportLocation
  const radius = Math.floor(location.radius / 2)

  randomTeleport(
    player,
    Vector.add(location, { x: radius, y: 0, z: radius }),
    Vector.add(location, { x: -radius, y: 0, z: -radius }),
    {
      elytra: false,
      teleportCallback() {
        // player.success('Вы были перемещены на случайную локацию.')
      },
      keepInSkyTime: 20,
    },
  )
}
