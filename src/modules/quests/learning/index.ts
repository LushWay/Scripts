import { ItemStack, system } from '@minecraft/server'
import { ActionForm, location, locationWithRadius, Vector } from 'lib'

import { MinecraftBlockTypes as b, MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { actionGuard, SafeAreaRegion } from 'lib'
import { Sounds } from 'lib/assets/config'
import { Join } from 'lib/player-join'
import { Quest } from 'lib/quest/index'
import { Airdrop } from 'lib/rpg/airdrop'
import { createPublicGiveItemCommand, Menu } from 'lib/rpg/menu'
import { Npc } from 'lib/rpg/npc'

import { Axe } from 'modules/features/axe'
import { Anarchy } from 'modules/places/anarchy'
import { OrePlace, ores } from 'modules/places/mineshaft/algo'
import { Spawn } from 'modules/places/spawn'
import { VillageOfMiners } from 'modules/places/village-of-miners/village-of-miners'
import { randomTeleport } from 'modules/survival/random-teleport'
import airdropTable from './airdrop'

// TODO Combine steps
// TODO Write second quests for investigating other places
// TODO Add catscenes

class Learning {
  id = 'learning'

  quest = new Quest('learning', 'Обучение', 'Обучение базовым механикам сервера', (q, player) => {
    if (!Anarchy.portal?.from || !Anarchy.portal.to) return q.failed('§cСервер не настроен')
    if (!this.randomTeleportLocation.valid || !this.craftingTableLocation.valid)
      return q.failed('§cОбучение не настроено')

    q.place(Anarchy.portal.from, Anarchy.portal.to, '§6Зайди в портал анархии')

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

          console.debug(`${player.name} have brocken ${brokenBlockPermutation.type.id}`)

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

            if (hit) {
              player.onScreenDisplay.setActionBar('§6Выйди под открытое небо!')
            } else {
              player.onScreenDisplay.setActionBar('')
              player.success('Посмотри наверх!')
              ctx.next()
            }
          },
          'learning quest, free space detecter',
          20,
        )
      })

    q.dynamic('Открой вагонетку').activate((ctx, firstTime) => {
      if (!player.isValid()) return

      function spawnAirdrop() {
        const airdrop = new Airdrop({ loot: airdropTable, forPlayerId: player.id })
        const position = Vector.add(player.location, { x: 0, y: 20, z: 0 })
        airdrop.spawn(position)
        return airdrop
      }

      function getAirdrop() {
        const airdrop = Airdrop.instances.find(e => e.id === ctx.db)
        if (!airdrop) throw new Quest.error('No airdrop found')
        return airdrop
      }

      const airdrop = firstTime ? spawnAirdrop() : getAirdrop()
      if (!airdrop.chestMinecart) return ctx.error('Не удалось вызвать аирдроп')

      ctx.world.afterEvents.playerInteractWithEntity.subscribe(event => {
        const airdropEntity = airdrop.chestMinecart
        if (!airdropEntity) return
        if (event.target.id !== airdropEntity.id) return

        if (player.id === event.player.id) ctx.system.delay(() => ctx.next())
      })

      ctx.world.afterEvents.entityDie.subscribe(event => {
        if (event.deadEntity.id !== airdrop.chestMinecart?.id) return
        ctx.system.delay(() => ctx.next())
      })

      let i = 0
      ctx.onInterval(() => {
        if (!airdrop.chestMinecart?.isValid()) return
        ctx.place = Vector.floor(airdrop.chestMinecart.location)

        if (i === 1) {
          i = 0
          airdrop.showParticleTrace(ctx.place)
        } else i++

        ctx.update()
      })
    })

    const crafting = Vector.add(this.craftingTableLocation, { x: 0.5, y: 0.5, z: 0.5 })

    q.item('§6Сделайте деревянную кирку')
      .description('Чтобы пойти в шахту, нужна кирка. Сделайте ее на верстаке в ближайшей деревне!')
      .isItem(item => item.typeId === MinecraftItemTypes.WoodenPickaxe)
      .place(crafting)

    q.counter((i, end) => `§6Добыто камня: §f${i}/${end}`, 10)
      .description('Отправляйтесь в шахту, найдите и накопайте камня.')
      .activate(ctx => {
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
      .description('Отправляйтесь в шахту и вскопайте камень. Кажется, за ним прячется железо!')
      .activate(ctx => {
        // Force iron ore generation
        ctx.subscribe(OrePlace, ({ player, isDeepslate }) => {
          if (player.id !== player.id) return

          ctx.db ??= { count: ctx.value }
          ;(ctx.db as { iron?: number }).iron ??= 0

          if ('iron' in ctx.db && typeof ctx.db.iron === 'number') {
            if (ctx.db.iron >= ctx.end) return
            ctx.db.iron++
            return isDeepslate ? b.DeepslateIronOre : b.IronOre
          }
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

    q.end(ctx => {
      player.success(
        'Обучение закончено! Вы можете пойти в каменоломню чтобы переплавить железо или продолжить добывать новые ресурсы в шахте.',
      )
    })
  })

  randomTeleportLocation = locationWithRadius(this.quest.group.point('safearea').name('Мирная зона и ртп'))

  craftingTableLocation = location(this.quest.group.point('crafting table').name('Верстак'))

  startAxe = new ItemStack(MinecraftItemTypes.WoodenAxe).setInfo('§r§6Начальный топор', 'Начальный топор')

  startAxeGiveCommand = createPublicGiveItemCommand('startwand', this.startAxe)

  safeArea: SafeAreaRegion | undefined = void 0

  minerNpc = new Npc(this.quest.group.point('minerNpc').name('Шахтер'), event => {
    if (!this.quest.getPlayerStep(event.player)) return false

    new ActionForm('Шахтер', 'Новенький? Не знаешь куда идти? ').show(event.player)
  })

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
