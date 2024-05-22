import { GameMode, Player } from '@minecraft/server'
import { InventoryStore, Portal, ValidSafeLocation, Vector, Zone, location, migrateLocationName } from 'lib'
import { tpMenuOnce } from 'modules/commands/tp'
import { Spawn } from 'modules/places/spawn'
import { showSurvivalHud } from 'modules/survival/sidebar'
import { isNotPlaying } from 'modules/world-edit/isBuilding'
import { DefaultPlaceWithInventory } from './lib/DefaultWithInventory'

migrateLocationName('anarchy_center', 'common', 'центр анархии')
migrateLocationName('anarchy_spawn_portal', 'common', 'портал на анархию')

class AnarchyBuilder extends DefaultPlaceWithInventory {
  portal: Portal | undefined

  zone: Zone | undefined

  learningRTP(player: Player) {
    // Hook function
  }

  inventoryName: InventoryTypeName = 'anarchy'

  centerLocation = location('common', 'центр анархии')

  portalLocation = location('common', 'портал на анархию')

  inventoryStore = new InventoryStore('anarchy')

  constructor() {
    super()

    this.centerLocation.onLoad.subscribe(centerLocation => {
      if (!centerLocation.firstLoad) return console.warn('Anarchy center changed, reload to update zone/radius command')

      this.zone = new Zone(centerLocation, players => players.length * 50)

      new Command('radius')
        .setDescription('Выдает радиус границы анархии сейчас')
        .setGroup('public')
        .setPermissions('member')
        .executes(ctx => ctx.player.info(`Радиус границы анархии сейчас: ${this.zone?.lastRadius}`))
    })

    console.log('§7Anarchy initialized')

    this.portalLocation.onLoad.subscribe(portalLocation => {
      // console.debug('Portal load', Vector.string(portalLocation))
      this.onValidPortalLocation(portalLocation)
    })
  }

  private onValidPortalLocation(portalLocation: ValidSafeLocation<Vector3>) {
    this.portal = new Portal(
      'anarchy',
      Vector.add(portalLocation, { x: 0, y: -1, z: -1 }),
      Vector.add(portalLocation, { x: 0, y: 1, z: 1 }),

      player => {
        if (isNotPlaying(player)) return tpMenuOnce(player)

        if (player.database.inv === this.inventoryName) {
          return player.fail(
            '§cВы уже находитесь на анархии! Если это не так, используйте §f.anarchy clearpos §cчтобы очистить позицию на анархии и §f.spawn§c для перемещения на спавн.',
          )
        }

        const title = Portal.canTeleport(player, { place: '§6> §cAnarchy §6<' })
        if (!title) return

        this.loadInventory(player)

        if (!player.database.survival.anarchy) {
          this.learningRTP(player)
        } else {
          player.teleport(player.database.survival.anarchy)
          delete player.database.survival.anarchy
        }

        showSurvivalHud(player)
        title()
      },
    )

    // TODO Support proper rtp
    if (portalLocation.firstLoad) {
      this.portal.command
        ?.overload('clearpos')
        .setDescription(
          'Очищает сохраненную точку анархии. При перемещении на анархию вы будете выброшены в случайную точку',
        )
        .executes(ctx => {
          delete ctx.player.database.survival.anarchy
          ctx.player.success(
            '§fУспех!§7 Теперь вы можете использовать §f-anarchy§7 для перемещения на случайную позицию.',
          )
        })
    }
  }

  loadInventory(player: Player) {
    super.loadInventory(player, () => {
      if (this.inventoryStore.has(player.id)) {
        player.log('Anarchy - loading saved inventory')
        InventoryStore.load({
          to: player,
          from: this.inventoryStore.get(player.id, { remove: true }),
        })
      } else {
        player.log('Anarchy - loading empty inventory')
        InventoryStore.load({ to: player, from: InventoryStore.emptyInventory })
      }

      if (player.getGameMode() === GameMode.adventure) player.setGameMode(GameMode.survival)
      player.database.inv = this.inventoryName
    })
  }

  saveInventory: DefaultPlaceWithInventory['saveInventory'] = player => {
    this.inventoryStore.saveFrom(player, {
      rewrite: true,
      keepInventory: false,
    })
    const inv = this.inventoryStore.get(player.id, { remove: false })

    player.log(
      'Anarchy - saved inventory',
      inv ? Object.entries(inv.slots).map(e => e[1] && e[0] + ' ' + e[1].typeId) : inv,
    )

    // Do not save location if on spawn
    if (Spawn.region?.isVectorInRegion(player.location, player.dimension.type)) return
    player.database.survival.anarchy = {
      x: Math.round(player.location.x),
      z: Math.round(player.location.z),
      y: Math.round(player.location.y),
    }
  }
}

// TODO Newbie savemode
export const Anarchy = new AnarchyBuilder()
