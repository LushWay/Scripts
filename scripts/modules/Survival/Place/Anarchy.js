import { Player, Vector, system, world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { Zone } from 'lib/Class/Zone.js'
import { Region, SafeAreaRegion } from 'lib/Region/Region.js'
import { isBuilding } from 'modules/Build/list.js'
import { tpMenu } from 'modules/Commands/tp.js'
import { EditableLocation, InventoryStore, Settings } from 'smapi.js'
import { Portal } from '../../../lib/Class/Portals.js'
import { randomTeleport } from '../features/randomTeleport.js'
import { SPAWN } from './Spawn.js'

export const ANARCHY = {
  centerLocation: new EditableLocation('anarchy_center'),
  portalLocation: new EditableLocation('anarchy_portal'),
  tpLocation: new EditableLocation('tp_portal'),
  inventory: new InventoryStore('anarchy'),
  /** @type {undefined | Portal} */
  portal: void 0,
  /** @type {undefined | SafeAreaRegion} */
  safeArea: void 0,
}

if (ANARCHY.centerLocation.valid) {
  const ANARCHY_ZONE = new Zone(ANARCHY.centerLocation, ps => ps.length * 50)

  Region.config.permissionLoad.subscribe(() => {
    ANARCHY.safeArea = SafeAreaRegion.ensureRegionInLocation({
      center: ANARCHY.centerLocation,
      radius: 100,
      dimensionId: 'overworld',
    })
  })

  new Command({
    name: 'radius',
    description: 'Выдает радиус границы анархии сейчас',
    type: 'public',
    role: 'member',
  }).executes(ctx => {
    ctx.reply(`☺ ${ANARCHY_ZONE.lastRadius}`)
  })
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
        if (building || !ANARCHY.centerLocation.valid) return tpMenuOnce(player)

        if (!(player.id in ANARCHY.inventory._.STORES)) {
          InventoryStore.load({
            from: {
              equipment: {},
              health: 20,
              xp: 0,
              slots: {},
            },
            to: player,
            clearAll: true,
          })
        } else {
          anarchyInventory(player)
        }

        data.inv = 'anarchy'

        if (!data.anarchy) {
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
        } else {
          player.teleport(data.anarchy)
          delete data.anarchy
        }
      })
    }
  )
  ANARCHY.portal.command
    ?.literal({
      name: 'clearpos',
      description:
        'Очищает сохраненную точку анархии. При перемещении на анархию вы будете выброшены в случайную точку',
    })
    .executes(ctx => {
      delete ctx.sender.database.survival.anarchy
      ctx.sender.playSound(SOUNDS.success)
      ctx.reply('§a> §fУспех!§7 Теперь вы можете использовать §f-anarchy§7 для перемещения на случайную позицию.')
    })
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
    if (
      // Skip death respawns
      !initialSpawn ||
      !settings(player).teleportToSpawnOnJoin ||
      isBuilding(player, true)
    )
      return

    SPAWN.portal?.teleport(player)
  })
}
