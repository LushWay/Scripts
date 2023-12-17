import { Player, Vector, system } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { EditableLocation, InventoryStore, Portal, Zone } from 'smapi.js'

import { isBuilding } from 'modules/Build/list.js'
import { DefaultPlaceWithInventory } from 'modules/Survival/Place/Default.place.js'
import { randomTeleportPlayerToLearning } from 'modules/Survival/Quests/Learning/index.js'
import { tpMenuOnce } from '../Features/builderTeleport'

class AnarchyBuilder extends DefaultPlaceWithInventory {
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
          const building = isBuilding(player)
          if (!Portal.canTeleport(player, { fadeScreen: !building })) return
          const data = player.database.survival

          if (data.inv === this.inventoryName) {
            return player.tell('§cВы уже находитесь на анархии!')
          }

          system.delay(() => {
            if (building) return tpMenuOnce(player)

            if (!this.inventoryStore.has(player.id)) {
              InventoryStore.load({
                from: InventoryStore.emptyInventory,
                to: player,
                clearAll: true,
              })
            } else {
              this.loadInventory(player)
            }

            data.inv = this.inventoryName

            if (!data.anarchy) {
              randomTeleportPlayerToLearning(player)
            } else {
              player.teleport(data.anarchy)
              delete data.anarchy
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
