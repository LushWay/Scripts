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

/**
 * @type {Set<string>}
 */
const sent = new Set()
if (ANARCHY.tpLocation.valid) {
  new Portal(
    'tp',
    Vector.add(ANARCHY.tpLocation, { x: 0, y: -1, z: -1 }),
    Vector.add(ANARCHY.tpLocation, { x: 0, y: 1, z: 1 }),
    tpMenuOnce
  )
}

/**
 * @param {Player} player
 */
function tpMenuOnce(player) {
  if (!sent.has(player.id)) {
    tpMenu(player).then(() => sent.delete(player.id))
    sent.add(player.id)
  }
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
      const building = isBuilding(player)
      if (!Portal.canTeleport(player, { fadeScreen: !building })) return
      const data = player.database.survival

      if (data.inv === 'anarchy') {
        return player.tell('§cВы уже находитесь на анархии!')
      }

      system.delay(() => {
        if (!data.anarchy || !(player.id in ANARCHY.inventory._.STORES)) {
          if (building || !ANARCHY.centerLocation.valid)
            return tpMenuOnce(player)

          randomTeleport(
            player,
            Vector.add(ANARCHY.centerLocation, { x: 100, y: 0, z: 100 }),
            Vector.add(ANARCHY.centerLocation, { x: -100, y: 0, z: -100 }),
            {
              elytra: false,
              teleportCallback() {
                player.tell('§a> §fВы были перемещены на случайную локацию.')
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
          if (!building) anarchyInventory(player)
          else Portal.canTeleport(player)

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
    if (
      !initialSpawn ||
      !settings(player).teleportToSpawnOnJoin ||
      isBuilding(player, true)
    )
      return

    SPAWN.portal?.teleport(player)
  })
}
