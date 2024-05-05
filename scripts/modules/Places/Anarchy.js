import { Player, Vector } from '@minecraft/server'
import { EditableLocation, InventoryStore, Portal, Zone } from 'lib.js'
import { tpMenuOnce } from 'modules/Commands/tp.js'
import { showSurvivalHud } from 'modules/Features/sidebar.js'
import { Spawn } from 'modules/Places/Spawn.js'
import { isNotPlaying } from 'modules/WorldEdit/isBuilding.js'
import { DefaultPlaceWithInventory } from './Default/WithInventory.js'

class AnarchyBuilder extends DefaultPlaceWithInventory {
  /** @param {Player} player */
  learningRTP(player) {}

  /** @type {InventoryTypeName} */
  inventoryName = 'anarchy'

  centerLocation = new EditableLocation('anarchy_center').safe

  portalLocation = new EditableLocation('anarchy_spawn_portal').safe

  inventoryStore = new InventoryStore('anarchy')

  constructor() {
    super()
    this.centerLocation.onLoad.subscribe(centerLocation => {
      this.zone = new Zone(centerLocation, players => players.length * 50)

      if (centerLocation.firstLoad)
        new Command('radius')
          .setDescription('Выдает радиус границы анархии сейчас')
          .setGroup('public')
          .setPermissions('member')
          .executes(ctx => {
            ctx.player.info(`Радиус границы анархии сейчас: ${this.zone.lastRadius}`)
          })
    })

    console.debug('Anarchy init')
    this.portalLocation.onLoad.subscribe(portalLocation => {
      // console.debug('Portal load', Vector.string(portalLocation))
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
    })
  }

  /** @param {Player} player */
  loadInventory(player) {
    super.loadInventory(player, () => {
      if (this.inventoryStore.has(player.id)) {
        console.log('loading saved inv for', player.name)
        InventoryStore.load({
          to: player,
          from: this.inventoryStore.get(player.id, { remove: true }),
        })
      } else {
        console.log('loading empty inventory for', player.name)
        InventoryStore.load({ to: player, from: InventoryStore.emptyInventory })
      }

      if (player.isGamemode('adventure')) player.runCommand('gamemode survival')
      player.database.inv = this.inventoryName
    })
  }

  /** @type {DefaultPlaceWithInventory['saveInventory']} */
  saveInventory(player) {
    this.inventoryStore.saveFrom(player, {
      rewrite: true,
      keepInventory: false,
    })
    console.log('Saved inv', this.inventoryStore.get(player.id, { remove: false }))

    // Do not save location if on spawn
    if (Spawn.region?.vectorInRegion(player.location)) return
    player.database.survival.anarchy = {
      x: Math.round(player.location.x),
      z: Math.round(player.location.z),
      y: Math.round(player.location.y),
    }
  }
}

// TODO Newbie savemode

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Anarchy = new AnarchyBuilder()
