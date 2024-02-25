import { ItemStack, Vector, system } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { SOUNDS } from 'config.js'
import { EditableLocation, Quest, SafeAreaRegion, Temporary, actionGuard } from 'lib.js'
import { Menu } from 'lib/Menu.js'
import { Axe } from 'modules/Features/axe.js'
import { randomTeleport } from 'modules/Features/randomTeleport.js'
import { Anarchy } from 'modules/Places/Anarchy.js'
import { Spawn } from 'modules/Places/Spawn.js'
import { VillageOfMiners } from 'modules/Places/VillageOfMiners.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { createPublicGiveItemCommand } from 'modules/Survival/createPublicGiveItemCommand.js'
import { LEARNING_L } from './airdrop.js'

// TODO Add even more steps,
// TODO Write second quests for investigating other places
// TODO Add catscenes

export class Learning {
  static quest = new Quest({ name: 'Обучение', desc: 'Обучение базовым механикам сервера', id: 'learning' }, q => {
    if (
      !Anarchy.portal ||
      !Anarchy.portal.from ||
      !Anarchy.portal.to ||
      !Learning.randomTeleportLocation.valid ||
      !Learning.craftingTableLocation.valid
    )
      return q.failed('§cОбучение или сервер не настроены')

    q.start(function () {
      // this.player.info('§6Обучение!')
    })

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

            this.player.playSound(SOUNDS.action)
            this.diff(1)
          })
        })
      },
    })

    q.dynamic({
      text: '§6Выйди под открытое небо',
      description: 'Деревья могут помешать. Выйди туда, где над тобой будет чистое небо',
      activate() {
        return new Temporary(({ system }) => {
          system.runInterval(
            () => {
              const hit = this.player.dimension.getBlockFromRay(
                this.player.location,
                { x: 0, y: 1, z: 0 },
                { includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 60 }
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
            20
          )
        })
      },
    })

    q.airdrop({
      lootTable: LEARNING_L,
      abovePlayerY: 20,
    })

    /** @param {string} text */
    const craftingTable = text =>
      Learning.craftingTableLocation.valid &&
      q.place(
        Vector.add(Learning.craftingTableLocation, { x: 10, y: 10, z: 10 }),
        Vector.add(Learning.craftingTableLocation, { x: -10, y: -10, z: -10 }),
        '§6Доберись до верстака на\n' + Vector.string(Learning.craftingTableLocation, true),
        text
      )

    craftingTable('Нужно где-то скрафтить кирку.')

    q.item({
      text: () => '§6Сделай деревянную кирку',
      description: 'Чтобы пойти в шахту, нужна кирка. Сделай ее!',
      isItem: item => item.typeId === MinecraftItemTypes.WoodenPickaxe,
    })

    q.counter({
      end: 10,
      text(i) {
        return `§6Накопайте §f${i}/${this.end}§6 камня`
      },
      description: () => 'Отправляйтесь в шахту, найдите и накопайте камня!',
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

    craftingTable('Чтобы сделать каменную кирку.')

    q.item({
      text: () => '§6Сделай каменную кирку',
      description: 'Время улучшить инструмент!',
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
        '§6Обучение закончено!\nВы можете пойти в каменоломню чтобы переплавить железо или продолжить добывавать новые ресурсы в шахте.'
      )
    })
  })
  static lootTable = LEARNING_L
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
  if (firstJoin) Learning.quest.enter(player)
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
    }
  )
}
