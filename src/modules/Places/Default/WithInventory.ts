import { Player } from '@minecraft/server'
import { isNotPlaying } from 'modules/WorldEdit/isBuilding'

export class DefaultPlaceWithInventory {
  static places: DefaultPlaceWithInventory[] = []

  inventoryName: InventoryTypeName

  constructor() {
    DefaultPlaceWithInventory.places.push(this)
  }

  /**
   * Loads and saves player inventory
   *
   * @param player - Player to load
   * @param callback - Function that gets executed when inventory actually needs to be loaded
   */
  loadInventory(player: Player, callback: VoidFunction) {
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

  saveInventory(player: Player) {}
}
