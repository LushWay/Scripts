import { Player, Vector, system, world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data.js'
import { isBuilding } from 'modules/Build/list.js'
import { EditableLocation, InventoryStore } from 'smapi.js'
import { Portal } from '../../../lib/Class/Portals.js'
import { Region, SafeAreaRegion } from '../../../lib/Region/Region.js'
import { Menu } from '../../Server/menuItem.js'
import { ANARCHY } from './anarchy.js'

export const SPAWN = {
  inventory: {
    xp: 0,
    health: 20,
    equipment: {},
    slots: { 0: Menu.item },
  },
  location: new EditableLocation('spawn', {
    fallback: new Vector(0, 200, 0),
  }),

  /** @type {undefined | Region} */
  region: void 0,

  /** @type {undefined | Portal} */
  portal: void 0,
}

/**
 * @param {Player} player
 */
function spawnInventory(player) {
  if (isBuilding(player)) return
  const data = player.database.survival

  if (data.inv === 'anarchy') {
    ANARCHY.inventory.saveFromEntity(player, {
      rewrite: true,
      keepInventory: false,
    })
    data.anarchy = Vector.floor(player.location)
  }

  if (data.inv !== 'spawn') {
    InventoryStore.load({ to: player, from: SPAWN.inventory })
    data.inv = 'spawn'
  }
}

if (SPAWN.location.valid) {
  world.setDefaultSpawnLocation(SPAWN.location)
  SPAWN.portal = new Portal('spawn', null, null, player => {
    if (!Portal.canTeleport(player)) return
    spawnInventory(player)

    player.teleport(SPAWN.location)
  })

  Region.config.permissionLoad.subscribe(() => {
    SPAWN.region = SafeAreaRegion.ensureRegionInLocation({
      center: SPAWN.location,
      radius: 100,
      dimensionId: 'overworld',
    })
  })

  system.runPlayerInterval(
    player => {
      if (SPAWN.region && SPAWN.region.vectorInRegion(player.location)) {
        spawnInventory(player)

        player.addEffect(MinecraftEffectTypes.Saturation, 1, {
          amplifier: 255,
          showParticles: false,
        })
      }
    },
    'SpawnRegion',
    20
  )
}
