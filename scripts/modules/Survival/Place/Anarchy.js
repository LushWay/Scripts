import { Player, Vector, system } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { isBuilding } from 'modules/Build/list.js'
import { DefaultPlaceWithInventory } from 'modules/Survival/utils/DefaultPlace.js'
import { EditableLocation, InventoryStore, Portal, Zone } from 'smapi.js'
import { tpMenuOnce } from '../Featuress/builderTeleport'

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
          ctx.reply(`☺ ${this.zone.lastRadius}`)
        })
    })

    this.portalLocation.onLoad.subscribe(portalLocation => {
      this.portal = new Portal(
        'anarchy',
        Vector.add(portalLocation, { x: 0, y: -1, z: -1 }),
        Vector.add(portalLocation, { x: 0, y: 1, z: 1 }),
        player => {
          if (isBuilding(player)) return tpMenuOnce(player)

          const db = player.database.survival

          if (db.inv === this.inventoryName) {
            return player.tell('§cВы уже находитесь на анархии!')
          }

          if (!Portal.canTeleport(player, { name: '§c> §6Anarchy §c<' })) return

          if (!this.inventoryStore.has(player.id)) {
            InventoryStore.load({
              from: InventoryStore.emptyInventory,
              to: player,
              clearAll: true,
            })
          } else {
            this.loadInventory(player)
          }

          db.inv = this.inventoryName

          system.delay(() => {
            if (!db.anarchy) {
              this.learningRTP(player)
            } else {
              player.teleport(db.anarchy)
              delete db.anarchy
            }
          })
        }
      )

      if (portalLocation.firstLoad)
        this.portal.command
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
        player.database.survival.inv = 'anarchy'
      }
    })
  }

  /** @type {DefaultPlaceWithInventory['saveInventory']} */
  saveInventory(player) {
    this.inventoryStore.saveFrom(player, {
      rewrite: true,
      keepInventory: false,
    })
    player.database.survival.anarchy = Vector.floor(player.location)
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Anarchy = new AnarchyBuilder()
