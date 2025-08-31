import { GameMode, Player, system, world } from '@minecraft/server'

import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { InventoryStore, Portal, Settings, locationWithRotation, util } from 'lib'

import { i18n, i18nShared, noI18n } from 'lib/i18n/text'
import { Join } from 'lib/player-join'
import { SphereArea } from 'lib/region/areas/sphere'
import { RegionEvents } from 'lib/region/events'
import { SafeAreaRegion } from 'lib/region/kinds/safe-area'
import { Menu } from 'lib/rpg/menu'
import { Group } from 'lib/rpg/place'
import { isNotPlaying } from 'lib/utils/game'
import { createLogger } from 'lib/utils/logger'
import { showSurvivalHud } from 'modules/survival/sidebar'
import { AreaWithInventory } from './lib/area-with-inventory'

class SpawnBuilder extends AreaWithInventory {
  group = new Group('common', i18nShared`Общее`)

  private readonly name = 'Spawn'

  private logger = createLogger(this.name)

  portal: Portal | undefined

  region: SafeAreaRegion | undefined

  inventoryName: InventoryTypeName = 'spawn'

  location = locationWithRotation(
    this.group.place('spawn').name(noI18n`Спавн`),
    { x: 0, y: 200, z: 0, xRot: 0, yRot: 0 },
    true,
  )

  settings = Settings.player(i18n`Вход`, 'join', {
    teleportToSpawnOnJoin: {
      value: true,
      name: i18n`Телепорт на спавн`,
      description: i18n`Определяет, будете ли вы телепортироваться на спавн при входе`,
    },
  })

  constructor() {
    super()
    this.onRegionInterval()
    if (this.location.valid) {
      const spawnLocation = this.location
      world.setDefaultSpawnLocation(spawnLocation)

      this.portal = new Portal('spawn', null, null, player => {
        if (!Portal.canTeleport(player)) return
        Portal.fadeScreen(player)

        this.switchInventory(player)
        spawnLocation.teleport(player)

        showSurvivalHud(player)

        // Need to happen last because showSurvivalHud will reset title show time
        Portal.showHudTitle(player, '§9> §bSpawn §9<')
      })

      this.portal
        .createCommand()
        .setPermissions('everybody')
        .setDescription(i18n.nocolor`§r§bПеремещает на спавн`)

      world.afterEvents.playerSpawn.unsubscribe(Join.eventsDefaultSubscribers.playerSpawn)
      world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
        // Skip after death respawns
        if (!initialSpawn) return
        if (player.isSimulated()) return
        if (isNotPlaying(player)) return Join.setPlayerJoinPosition(player)

        // Check settings
        if (!this.settings(player).teleportToSpawnOnJoin)
          return this.logger.player(player)
            .info`Not teleporting to spawn on join because player disabled it via settings`

        util.catch(() => {
          this.logger.player(player).info`Teleporting player to spawn on join`
          this.portal?.teleport(player)
          system.runTimeout(() => Join.setPlayerJoinPosition(player), 'Spawn set player position after join', 10)
        })
      })

      this.region = SafeAreaRegion.create(new SphereArea({ center: spawnLocation, radius: 30 }, 'overworld'))
    }
  }

  loadInventory(player: Player): void {
    InventoryStore.load({
      to: player,
      from: {
        xp: 0,
        health: 20,
        equipment: {},
        slots: { 0: Menu.itemStack },
      },
      clearAll: true,
    })
    player.database.inv = 'spawn'
  }

  saveInventory = undefined

  private onRegionInterval() {
    RegionEvents.onInterval.subscribe(({ player, currentRegion: region }) => {
      if (player.isSimulated()) return
      if (region === this.region) {
        if (player.getGameMode() === GameMode.Survival) {
          player.setGameMode(GameMode.Adventure)
        }
        player.addEffect(MinecraftEffectTypes.Saturation, 1, {
          amplifier: 255,
          showParticles: false,
        })
      } else {
        if (player.database.inv === 'spawn' && !isNotPlaying(player)) {
          this.switchInventory(player)
          this.portal?.teleport(player)
        }
      }
    })
  }
}

export const Spawn = new SpawnBuilder()
