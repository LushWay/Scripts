import { Player, Vector, system, world } from '@minecraft/server'
import { Quest } from 'lib/Class/Quest.js'
import { Sidebar } from 'lib/Class/Sidebar.js'
import { ActionForm, EditableLocation, InventoryStore, util } from 'xapi.js'
import { Portal } from '../../../lib/Class/Portals.js'
import { Zone } from '../Minigames/BattleRoyal/zone.js'
import { randomTeleport } from './rtp.js'
import { SPAWN } from './spawn.js'

export const ANARCHY = {
  centerLocation: new EditableLocation('anarchy_center'),
  portalLocation: new EditableLocation('anarchy_portal'),
  inventory: new InventoryStore('anarchy'),
  /** @type {undefined | Portal} */
  portal: void 0,
}
if (ANARCHY.centerLocation.valid) {
  system.runInterval(
    () => {
      const players = world.getPlayers()
      const radius = players.length * 50

      const rmax = {
        x: ANARCHY.centerLocation.x + radius,
        y: 0,
        z: ANARCHY.centerLocation.z + radius,
      }

      const rmin = {
        x: ANARCHY.centerLocation.x - radius,
        y: 0,
        z: ANARCHY.centerLocation.z - radius,
      }

      for (const p of players) {
        const l = Vector.floor(p.location)
        if (
          l.x >= rmax.x &&
          l.x <= rmax.x + 10 &&
          l.z <= rmax.z &&
          l.z >= rmin.z
        )
          return Zone.tp(p, true, rmax)

        if (
          l.x >= rmax.x - 10 &&
          l.x <= rmax.x &&
          l.z <= rmax.z &&
          l.z >= rmin.z
        )
          return Zone.warn(p, true, rmax)

        if (
          l.z >= rmax.z &&
          l.z <= rmax.z + 10 &&
          l.x <= rmax.x &&
          l.x >= rmin.x
        )
          return Zone.tp(p, false, rmax)

        if (
          l.z >= rmax.z - 10 &&
          l.z <= rmax.z &&
          l.x <= rmax.x &&
          l.x >= rmin.x
        )
          return Zone.warn(p, false, rmax)

        if (
          l.x <= rmin.x &&
          l.x >= rmin.x - 10 &&
          l.z <= rmax.z &&
          l.z >= rmin.z
        )
          return Zone.tp(p, true, rmin, true)

        if (
          l.x <= rmin.x + 10 &&
          l.x >= rmin.x &&
          l.z <= rmax.z &&
          l.z >= rmin.z
        )
          return Zone.warn(p, true, rmin)

        if (
          l.z <= rmin.z &&
          l.z >= rmin.z - 10 &&
          l.x <= rmax.x &&
          l.x >= rmin.x
        )
          return Zone.tp(p, false, rmin, true)

        if (
          l.z <= rmin.z + 10 &&
          l.z >= rmin.z &&
          l.x <= rmax.x &&
          l.x >= rmin.x
        )
          return Zone.warn(p, false, rmin)

        // TODO detect if player in the zone
        // anarchyInventory(p, p.db());
      }
    },
    'zone',
    10
  )
}
/**
 *
 * @param {Player} player
 */
function anarchyInventory(player) {
  if (player.database.survival.inv !== 'anarchy') {
    if (player.id in ANARCHY.inventory._.STORES) {
      InventoryStore.load({
        to: player,
        from: ANARCHY.inventory.getEntityStore(player.id, true),
      })
      player.database.survival.inv = 'anarchy'
    }
  }
}
if (ANARCHY.portalLocation.valid) {
  ANARCHY.portal = new Portal(
    'anarchy',
    Vector.add(ANARCHY.portalLocation, { x: 0, y: -1, z: -1 }),
    Vector.add(ANARCHY.portalLocation, { x: 0, y: 1, z: 1 }),
    player => {
      if (!Portal.canTeleport(player)) return
      const data = player.database.survival

      if (data.inv === 'anarchy') {
        return player.tell('§cВы уже находитесь на анархии!')
      }

      system.run(() =>
        util.catch(() => {
          if (!data.anarchy || !(player.id in ANARCHY.inventory._.STORES)) {
            randomTeleport(
              player,
              { x: 500, y: 0, z: 500 },
              { x: 1500, y: 0, z: 1500 },
              {
                elytra: true,
                teleportCallback() {
                  player.tell('§a> §fВы были перемещены.')
                  player.playSound('note.pling')
                },
                keepInSkyTime: 20,
              }
            )

            InventoryStore.load({
              from: {
                equipment: {},
                health: 20,
                xp: 0,
                slots: [SPAWN.startAxeItem],
              },
              to: player,
              clearAll: true,
            })
            data.inv = 'anarchy'
          } else {
            anarchyInventory(player)

            player.teleport(data.anarchy)
            delete data.anarchy
          }
        })
      )
    }
  )
}

if (ANARCHY.portal) {
  const learning = new Quest('Обучение', q => {
    if (!ANARCHY.portal || !ANARCHY.portal.from || !ANARCHY.portal.to)
      return q.failed('§cСервер не настроен')

    q.start(function () {
      this.player.tell('§6Квест начался!')
      this.player.playSound('note.pling')
    })

    q.place(ANARCHY.portal.from, ANARCHY.portal.to, '§6Зайди в портал анархии')

    q.counter({
      end: 5,
      text(value) {
        return `§6Наруби §f${value}/${this.end} §6блоков дерева`
      },
      activate() {
        const blocksEvent = world.beforeEvents.playerBreakBlock.subscribe(
          ({ player, block }) => {
            if (player.id !== this.player.id) return
            if (!SPAWN.startAxeCanBreak.includes(block.type.id)) return

            this.diff(1)
          }
        )

        return {
          cleanup() {
            world.beforeEvents.playerBreakBlock.unsubscribe(blocksEvent)
          },
        }
      },
    })

    q.end(function () {
      this.player.playSound('note.pling')
      this.player.tell('§6Квест закончен!')
    })
  })

  new XCommand({
    name: 'q',
    role: 'admin',
  }).executes(ctx => {
    const form = new ActionForm('Quests', 'Выбери')
    form.addButton('Learning', () => {
      learning.enter(ctx.sender)
    })
    form.show(ctx.sender)
  })

  const anarchySidebar = new Sidebar(
    { name: 'Anarchy' },
    player => {
      return '§7Инвентарь: ' + player.database.survival.inv
    },
    player => {
      return `§7Монеты: §6${player.scores.money}§7 | Листья: §2${player.scores.leafs}`
    },
    ' ',
    Quest.sidebar,
    ' ',
    '§7shp1nat56655.portmap.io'
  )
  anarchySidebar.setUpdateInterval(20)

  world.getAllPlayers().forEach(e => anarchySidebar.subscribe(e))

  world.afterEvents.playerSpawn.subscribe(({ player }) => {
    anarchySidebar.subscribe(player)
  })

  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    anarchySidebar.unsubscribe(playerId)
  })
}
