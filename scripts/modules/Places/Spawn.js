import { Player, system, world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data.js'
import { EditableLocation, InventoryStore, PLAYER_DB, Portal, SafeAreaRegion, Settings, util } from 'lib.js'

import { migration } from 'lib/Database/Migrations.js'
import { Menu } from 'lib/Menu.js'
import { isBuilding } from 'modules/Build/isBuilding'
import { DefaultPlaceWithInventory } from './Default/WithInventory.js'

migration('move player inv', () => {
  Object.values(PLAYER_DB).forEach(e => {
    // @ts-expect-error migration
    delete e.survival.inv
  })
})

class SpawnBuilder extends DefaultPlaceWithInventory {
  /**
   * @type {InventoryTypeName}
   */
  inventoryName = 'spawn'
  location = new EditableLocation('spawn', {
    fallback: { x: 0, y: 200, z: 0, xRot: 0, yRot: 0 },
    type: 'vector3+rotation',
  }).safe

  /**
   * @type {import('lib.js').Inventory}
   */
  inventory = {
    xp: 0,
    health: 20,
    equipment: {},
    slots: { 0: Menu.item },
  }

  settings = Settings.player('Вход', 'join', {
    teleportToSpawnOnJoin: {
      value: true,
      name: 'Телепорт на спавн',
      desc: 'Определяет, будете ли вы телепортироваться на спавн при входе',
    },
  })

  /**
   * Loads spawn inventory to specified player
   * @param {Player} player
   */
  loadInventory(player) {
    super.loadInventory(player, () => {
      InventoryStore.load({ to: player, from: this.inventory, clearAll: true })
      player.database.inv = 'spawn'
    })
  }

  constructor() {
    super()
    if (this.location.valid) {
      const spawnLocation = this.location
      world.setDefaultSpawnLocation(spawnLocation)
      this.portal = new Portal('spawn', null, null, player => {
        if (!Portal.canTeleport(player, { place: '§9> §bSpawn §9<' })) return

        this.loadInventory(player)
        system.delay(() => spawnLocation.teleport(player))
      })

      world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
        // Skip death respawns
        if (!initialSpawn) return

        // Force know if player is building
        if (isBuilding(player, true)) return

        // Check settings
        if (!this.settings(player).teleportToSpawnOnJoin) return

        util.catch(() => this.portal?.teleport(player))
      })

      this.region = new SafeAreaRegion({
        center: spawnLocation,
        radius: 30,
        dimensionId: 'overworld',
      })
    }
  }
  /** @type {import('lib.js').regionCallback} */
  regionCallback(player, region) {
    if (region === this.region) {
      player.addEffect(MinecraftEffectTypes.Saturation, 1, {
        amplifier: 255,
        showParticles: false,
      })
    } else {
      if (player.database.inv === 'spawn' && !isBuilding(player)) {
        this.loadInventory(player)
        this.portal?.teleport(player)
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Spawn = new SpawnBuilder()
