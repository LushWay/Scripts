import { ItemStack, Vector, system } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { SOUNDS } from 'config.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { AXE } from 'modules/Survival/Features/axe.js'
import { randomTeleport } from 'modules/Survival/Features/randomTeleport.js'
import { Anarchy } from 'modules/Survival/Place/Anarchy.js'
import { Spawn } from 'modules/Survival/Place/Spawn.js'
import { createPublicGiveItemCommand } from 'modules/Survival/utils/createPublicGiveItemCommand.js'
import { EditableLocation, Quest, SafeAreaRegion, Temporary } from 'smapi.js'
import { LEARNING_L } from './lootTables.js'

// TODO! Ensure that no dupes happening
// TODO Rewrite quest, include new steps
// TODO Rewrite as a class

export const LEARNING = {
  QUEST: new Quest({ displayName: 'Обучение', name: 'learning' }, q => {
    if (
      !Anarchy.portal ||
      !Anarchy.portal.from ||
      !Anarchy.portal.to ||
      !LEARNING.RTP_LOCATION.valid ||
      !LEARNING.CRAFTING_TABLE_LOCATION.valid
    )
      return q.failed('§cОбучение или сервер не настроены')

    q.start(function () {
      this.player.info('§6Обучение!')
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
            LEARNING.GIVE_AXE_COMMAND?.ensure(this.player)
          })
        }

        return new Temporary(({ world }) => {
          world.afterEvents.playerBreakBlock.subscribe(({ player, brokenBlockPermutation }) => {
            if (player.id !== this.player.id) return
            if (!AXE.BREAKS.includes(brokenBlockPermutation.type.id)) return

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
                this.player.onScreenDisplay.setActionBar('§6Выйди на открытую местность!')
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
    })

    q.place(
      Vector.add(LEARNING.CRAFTING_TABLE_LOCATION, { x: 10, y: 10, z: 10 }),
      Vector.add(LEARNING.CRAFTING_TABLE_LOCATION, { x: -10, y: -10, z: -10 }),
      '§6Доберитесь до верстака на\n' + Vector.string(LEARNING.CRAFTING_TABLE_LOCATION, true),
      'Нужно же где-то скрафтить кирку, верно?'
    )

    q.dynamic({
      text: () => '§6Скрафтите деревянную кирку',
      description: 'Чтобы пойти в шахту, нужна кирка. Сделайте ее!',
      activate() {
        return new Temporary(({ system }) => {
          system.runInterval(
            () => {
              const { container } = this.player
              if (!container) return
              for (const [, item] of container.entries()) {
                if (item?.typeId === MinecraftItemTypes.WoodenPickaxe) {
                  this.next()
                }
              }
            },
            'inv check learning',
            20
          )
        })
      },
    })

    q.counter({
      end: 10,
      text(i) {
        return `§6Накопайте §f${i}/${this.end}§6 камня`
      },
      description: () => 'Отправляйтесь в шахту и накопайте камня!',
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

    q.end(function () {
      this.player.success('§6Обучение закончено!')
    })
  }),
  LOOT_TABLE: LEARNING_L,
  RTP_LOCATION: new EditableLocation('learning_quest_rtp', { type: 'vector3+radius' }).safe,
  CRAFTING_TABLE_LOCATION: new EditableLocation('learning_quest_crafting_table').safe,

  START_AXE: new ItemStack(MinecraftItemTypes.WoodenAxe).setInfo('§r§6Начальный топор', 'Начальный топор'),
  /** @type {SafeAreaRegion | undefined} */
  SAFE_AREA: void 0,
  /** @type {ReturnType<typeof createPublicGiveItemCommand> | undefined} */
  GIVE_AXE_COMMAND: void 0,
}

LEARNING.RTP_LOCATION.onLoad.subscribe(location => {
  LEARNING.SAFE_AREA = new SafeAreaRegion({
    permissions: { allowedEntities: 'all' },
    center: location,
    radius: location.radius,
    dimensionId: 'overworld',
  })

  AXE.ALLOW_BREAK_IN_REGIONS.push(LEARNING.SAFE_AREA)
})

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) LEARNING.QUEST.enter(player)
})

LEARNING.GIVE_AXE_COMMAND = createPublicGiveItemCommand('startwand', LEARNING.START_AXE)

Anarchy.learningRTP = player => {
  if (!LEARNING.RTP_LOCATION.valid) {
    player.fail('Случайное перемещение не настроено')
    Spawn.portal?.teleport(player)
    delete player.database.survival.anarchy
    return
  }

  const location = LEARNING.RTP_LOCATION
  const radius = Math.floor(location.radius / 2)

  randomTeleport(
    player,
    Vector.add(location, { x: radius, y: 0, z: radius }),
    Vector.add(location, { x: -radius, y: 0, z: -radius }),
    {
      elytra: false,
      teleportCallback() {
        player.success('Вы были перемещены на случайную локацию.')
      },
      keepInSkyTime: 20,
    }
  )
}
