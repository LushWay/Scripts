import { Player, Vector, system, world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { isBuilding } from 'modules/Gameplay/Build/list.js'
import { Zone } from 'modules/Server/Class/Zone.js'
import { tpMenu } from 'modules/Server/Commands/tp.js'
import { EditableLocation, InventoryStore, Settings } from 'smapi.js'
import { Portal } from '../../../lib/Class/Portals.js'
import { randomTeleport } from './randomTeleport.js'
import { SPAWN } from './spawn.js'

export const ANARCHY = {
  centerLocation: new EditableLocation('anarchy_center'),
  portalLocation: new EditableLocation('anarchy_portal'),
  tpLocation: new EditableLocation('tp_portal'),
  inventory: new InventoryStore('anarchy'),
  /** @type {undefined | Portal} */
  portal: void 0,
}
if (ANARCHY.centerLocation.valid) {
  new Zone(ANARCHY.centerLocation, ps => ps.length * 50)
}

if (ANARCHY.tpLocation.valid) {
  new Portal(
    'tp',
    Vector.add(ANARCHY.tpLocation, { x: 0, y: -1, z: -1 }),
    Vector.add(ANARCHY.tpLocation, { x: 0, y: 1, z: 1 }),
    player => {
      tpMenu(player)
    }
  )
}

/**
 * @param {Player} player
 */
function anarchyInventory(player) {
  if (player.database.survival.inv !== 'anarchy') {
    if (player.id in ANARCHY.inventory._.STORES) {
      InventoryStore.load({
        to: player,
        from: ANARCHY.inventory.getEntityStore(player.id, { remove: true }),
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

      system.delay(() => {
        if (!data.anarchy || !(player.id in ANARCHY.inventory._.STORES)) {
          if (isBuilding(player.id)) return tpMenu(player)

          randomTeleport(
            player,
            { x: 500, y: 0, z: 500 },
            { x: 1500, y: 0, z: 1500 },
            {
              elytra: true,
              teleportCallback() {
                player.tell('§a> §fВы были перемещены.')
                player.playSound(SOUNDS.success)
              },
              keepInSkyTime: 20,
            }
          )

          InventoryStore.load({
            from: {
              equipment: {},
              health: 20,
              xp: 0,
              slots: { 0: SPAWN.startAxeItem },
            },
            to: player,
            clearAll: true,
          })
          data.inv = 'anarchy'
        } else {
          if (!isBuilding(player.id)) anarchyInventory(player)

          player.teleport(data.anarchy)
          delete data.anarchy
        }
      })
    }
  )
}

const settings = Settings.player('Вход', 'join', {
  teleportToSpawnOnJoin: {
    value: true,
    name: 'Телепорт на спавн',
    desc: 'Определяет, будете ли вы телепортироваться на спавн при входе',
  },
})

if (ANARCHY.portal && SPAWN.location.valid) {
  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    // Skip death respawns
    if (!initialSpawn || !settings(player).teleportToSpawnOnJoin) return

    SPAWN.portal?.teleport(player)
  })
}
