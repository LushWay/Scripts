import { Player, Vector, system } from '@minecraft/server'
import { EditableLocation, InventoryStore, Portal, Zone } from 'lib.js'
import { isBuilding } from 'modules/Build/isBuilding.js'
import { tpMenuOnce } from 'modules/Commands/tp.js'
import { Spawn } from 'modules/Places/Spawn.js'
import { DefaultPlaceWithInventory } from './Default/WithInventory.js'

// TODO Not set anarchy pos when on spawn
// TODO TP even if there is no pos

class AnarchyBuilder extends DefaultPlaceWithInventory {
  /**
   * @param {Player} player
   */
  learningRTP(player) {}
  /**
   * @type {InventoryTypeName}
   */
  inventoryName = 'anarchy'
  centerLocation = new EditableLocation('anarchy_center').safe
  portalLocation = new EditableLocation('anarchy_spawn_portal').safe
  inventoryStore = new InventoryStore('anarchy')

  constructor() {
    super()
    this.centerLocation.onLoad.subscribe(centerLocation => {
      this.zone = new Zone(centerLocation, players => players.length * 50)

      if (centerLocation.firstLoad)
        new Command({
          name: 'radius',
          description: 'Выдает радиус границы анархии сейчас',
          type: 'public',
          role: 'member',
        }).executes(ctx => {
          ctx.sender.info(`Радиус границы анархии сейчас: ${this.zone.lastRadius}`)
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
          if (isBuilding(player)) return tpMenuOnce(player)

          if (player.database.inv === this.inventoryName) {
            return player.fail(
              '§cВы уже находитесь на анархии! Если это не так, используйте §f.anarchy clearpos §cчтобы очистить позицию на анархии'
            )
          }

          system.delay(() => {
            if (!Portal.canTeleport(player, { place: '§c> §6Anarchy §c<' })) return

            if (!this.inventoryStore.has(player.id)) {
              InventoryStore.load({
                from: InventoryStore.emptyInventory,
                to: player,
                clearAll: true,
              })
            } else {
              this.loadInventory(player)
            }

            player.database.inv = this.inventoryName

            if (!player.database.survival.anarchy) {
              this.learningRTP(player)
            } else {
              player.teleport(player.database.survival.anarchy)
              delete player.database.survival.anarchy
            }
          })
        }
      )

      // TODO Support proper rtp
      if (portalLocation.firstLoad) {
        this.portal.command
          ?.literal({
            name: 'clearpos',
            description:
              'Очищает сохраненную точку анархии. При перемещении на анархию вы будете выброшены в случайную точку',
          })
          .executes(ctx => {
            delete ctx.sender.database.survival.anarchy
            ctx.sender.success(
              '§fУспех!§7 Теперь вы можете использовать §f-anarchy§7 для перемещения на случайную позицию.'
            )
          })
      }
    })
  }

  /**
   * @param {Player} player
   */
  loadInventory(player) {
    super.loadInventory(player, () => {
      if (this.inventoryStore.has(player.id)) {
        InventoryStore.load({
          to: player,
          from: this.inventoryStore.get(player.id, { remove: true }),
        })
        player.database.inv = 'anarchy'
      }
    })
  }

  /** @type {DefaultPlaceWithInventory['saveInventory']} */
  saveInventory(player) {
    this.inventoryStore.saveFrom(player, {
      rewrite: true,
      keepInventory: false,
    })

    // Do not save location if on spawn
    if (Spawn.region?.vectorInRegion(player.location)) return
    player.database.survival.anarchy = Vector.floor(player.location)
  }
}

// TODO Newbie savemode
// TODO Help players on kill
// TODO Death stones with loot which can be looted only by player who dead

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Anarchy = new AnarchyBuilder()
