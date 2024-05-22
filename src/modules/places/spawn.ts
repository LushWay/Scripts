import { GameMode, Player, system, world } from '@minecraft/server'

import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { InventoryStore, Portal, RegionCallback, Settings, locationWithRotation, migrateLocationName, util } from 'lib'

import { Menu } from 'lib/menu'
import { Join } from 'lib/player-join'
import { SafeAreaRegion } from 'lib/region/kinds/SafeAreaRegion'
import { showSurvivalHud } from 'modules/survival/sidebar'
import { isNotPlaying } from 'modules/world-edit/isBuilding'
import { DefaultPlaceWithInventory } from './lib/DefaultWithInventory'

migrateLocationName('spawn', 'common', 'spawn')

class SpawnBuilder extends DefaultPlaceWithInventory {
  portal: Portal | undefined

  region: SafeAreaRegion | undefined

  inventoryName: InventoryTypeName = 'spawn'

  location = locationWithRotation('common', 'spawn', { x: 0, y: 200, z: 0, xRot: 0, yRot: 0 })

  inventory: import('lib').Inventory = {
    xp: 0,
    health: 20,
    equipment: {},
    slots: { 0: Menu.item },
  }

  settings = Settings.player('Вход', 'join', {
    teleportToSpawnOnJoin: {
      value: true,
      name: 'Телепорт на спавн',
      description: 'Определяет, будете ли вы телепортироваться на спавн при входе',
    },
  })

  private readonly name = 'Spawn'

  /** Loads spawn inventory to specified player */
  loadInventory(player: Player) {
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
      this.portal = new Portal(
        'spawn',
        null,
        null,
        player => {
          const title = Portal.canTeleport(player, { place: '§9> §bSpawn §9<' })
          if (!title) return

          this.loadInventory(player)
          spawnLocation.teleport(player)

          showSurvivalHud(player)
          title()
        },
        { allowAnybody: true },
      )

      world.afterEvents.playerSpawn.unsubscribe(Join.eventsDefaultSubscribers.playerSpawn)
      world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
        // Skip after death respawns
        if (!initialSpawn) return
        if (player.isSimulated()) return
        if (isNotPlaying(player)) return Join.setPlayerJoinPosition(player)

        // Check settings
        if (!this.settings(player).teleportToSpawnOnJoin)
          return player.log(this.name, 'not teleporting to spawn on join because player disabled it via settings')

        util.catch(() => {
          player.log(this.name, 'teleporting player to spawn on join')
          this.portal?.teleport(player)
          system.runTimeout(() => Join.setPlayerJoinPosition(player), 'Spawn set player position after join', 10)
        })
      })

      this.region = SafeAreaRegion.create({
        center: spawnLocation,
        radius: 30,
        dimensionId: 'overworld',
      })
    }
  }

  regionCallback: RegionCallback = (player, region) => {
    if (player.isSimulated()) return
    if (region === this.region) {
      if (player.getGameMode() === GameMode.survival) {
        player.setGameMode(GameMode.adventure)
      }
      player.addEffect(MinecraftEffectTypes.Saturation, 1, {
        amplifier: 255,
        showParticles: false,
      })
    } else {
      if (player.database.inv === 'spawn' && !isNotPlaying(player)) {
        this.loadInventory(player)
        this.portal?.teleport(player)
      }
    }
  }
}

export const Spawn = new SpawnBuilder()
