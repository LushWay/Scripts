import { ItemStack, system } from '@minecraft/server'
import { ActionForm, Vector, location, locationWithRadius, migrateLocationName } from 'lib'

import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { SafeAreaRegion, Temporary, actionGuard } from 'lib'
import { SOUNDS } from 'lib/assets/config'
import { EditableNpc } from 'lib/editable-npc'
import { Menu, createPublicGiveItemCommand } from 'lib/menu'
import { Join } from 'lib/player-join'
import { Axe } from 'modules/features/axe'
import { Anarchy } from 'modules/places/anarchy'
import { Spawn } from 'modules/places/spawn'
import { VillageOfMiners } from 'modules/places/village-of-miners'
import { Quest, QuestBase } from 'modules/quests/lib/quest'
import { randomTeleport } from 'modules/survival/random-teleport'
import airdropTable from './airdrop'

// TODO Combine steps
// TODO Write second quests for investigating other places
// TODO Add catscenes

migrateLocationName('learning_quest_crafting_table', 'quest: learning', 'Верстак')
migrateLocationName('learning_quest_rtp', 'quest: learning', 'Мирная зона и ртп')

class Learning extends QuestBase {
  id = 'learning'

  randomTeleportLocation = locationWithRadius(this.group, 'Мирная зона и ртп')

  craftingTableLocation = location(this.group, 'Верстак')

  startAxe = new ItemStack(MinecraftItemTypes.WoodenAxe).setInfo('§r§6Начальный топор', 'Начальный топор')

  startAxeGiveCommand = createPublicGiveItemCommand('startwand', this.startAxe)

  safeArea: SafeAreaRegion | undefined = void 0

  minerNpc = new EditableNpc({
    dimensionId: 'overworld',
    id: 'minerNpc',
    group: this.group,
    name: 'Шахтер',
    onInteract: event => {
      if (!this.quest.current(event.player)) return false

      new ActionForm('Шахтер', 'Новенький? Не знаешь куда идти? ').show(event.player)
    },
  })

  quest = new Quest({ name: 'Обучение', desc: 'Обучение базовым механикам сервера', id: 'learning' }, (q, player) => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    if (
      !Anarchy.portal ||
      !Anarchy.portal.from ||
      !Anarchy.portal.to ||
      !this.randomTeleportLocation.valid ||
      !this.craftingTableLocation.valid
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
            self.startAxeGiveCommand?.ensure(this.player)
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

    q.item({
      text: () => '§6Сделайте деревянную кирку',
      description: 'Чтобы пойти в шахту, нужна кирка. Сделайте ее!',
      isItem: item => item.typeId === MinecraftItemTypes.WoodenPickaxe,
      place: this.craftingTableLocation,
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

    q.item({
      text: () => '§6Сделайте каменную кирку',
      description: 'Сделайте каменную кирку. Время улучшить инструмент!',
      isItem: item => item.typeId === MinecraftItemTypes.StonePickaxe,
      place: this.craftingTableLocation,
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

    q.end(function (this) {
      this.player.success(
        'Обучение закончено! Вы можете пойти в каменоломню чтобы переплавить железо или продолжить добывавать новые ресурсы в шахте.',
      )
    })
  })

  constructor() {
    //
    super()
    actionGuard((player, region, ctx) => {
      if (ctx.type !== 'break') return
      if (region !== VillageOfMiners.safeArea) return
      if (this.quest.current(player)) {
        system.delay(() => {
          player.fail('Блоки можно ломать только глубже в шахте!')
        })
      }
    })

    this.randomTeleportLocation.onLoad.subscribe(location => {
      this.safeArea = SafeAreaRegion.create({
        permissions: { allowedEntities: 'all' },
        center: location,
        radius: location.radius * 5,
        dimensionId: 'overworld',
      })

      Axe.allowBreakInRegions.push(this.safeArea)
    })

    Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (player.database.role === 'spectator') {
        player.info(
          '§fСервер еще не готов. Если вы хотите стать строителем или тестером - подайте заявку на нашем дискорд сервере: §bdsc.gg/lushway§f, а пока вы можете только наблюдать.',
        )
      } else if (firstJoin) this.quest.enter(player)
    })

    Anarchy.learningRTP = player => {
      if (!this.randomTeleportLocation.valid) {
        player.fail('Случайное перемещение не настроено')
        Spawn.portal?.teleport(player)
        delete player.database.survival.anarchy
        return
      }

      const location = this.randomTeleportLocation
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
  }
}

new Learning()
