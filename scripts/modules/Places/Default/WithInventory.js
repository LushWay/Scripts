import { Player } from '@minecraft/server'
import { isNotPlaying } from 'modules/WorldEdit/isBuilding.js'

export class DefaultPlaceWithInventory {
  /** @type {DefaultPlaceWithInventory[]} */
  static places = []

  /** @type {InventoryTypeName} */
  inventoryName

  constructor() {
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
      if (place.inventoryName === currentInventory) {
        place.saveInventory(player)
      }
    })

    callback()
  }

  /** @param {Player} player */
  saveInventory(player) {}
}
