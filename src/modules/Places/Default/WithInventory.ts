import { Player } from '@minecraft/server'
import { isNotPlaying } from 'modules/WorldEdit/isBuilding'

export class DefaultPlaceWithInventory {
  /** @type {DefaultPlaceWithInventory[]} */
  static places = []

  /** @type {InventoryTypeName} */
  inventoryName

  constructor() {
    // @ts-expect-error TS(2345) FIXME: Argument of type 'this' is not assignable to param... Remove this comment to see the full error message
    DefaultPlaceWithInventory.places.push(this)
  }

  /**
   * Loads and saves player inventory
   *
   * @param {Player} player - Player to load
   * @param {VoidFunction} callback - Function that gets executed when inventory actually needs to be loaded
   */
  loadInventory(player, callback) {
    if (isNotPlaying(player)) return

    const currentInventory = player.database.inv
    if (currentInventory === this.inventoryName) return

    DefaultPlaceWithInventory.places.forEach(place => {
      // Prevent from self saving
      if (place === this) return

      // @ts-expect-error TS(2339) FIXME: Property 'inventoryName' does not exist on type 'n... Remove this comment to see the full error message
      if (place.inventoryName === currentInventory) {
        // @ts-expect-error TS(2339) FIXME: Property 'saveInventory' does not exist on type 'n... Remove this comment to see the full error message
        place.saveInventory(player)
      }
    })

    callback()
  }

  /** @param {Player} player */
  saveInventory(player) {}
}
