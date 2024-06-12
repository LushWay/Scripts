import { Player } from '@minecraft/server'
import { isNotPlaying } from 'lib/game-utils'

export abstract class DefaultPlaceWithInventory {
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
  switchInventory(player: Player) {
    if (isNotPlaying(player)) return

    const currentInventory = player.database.inv
    if (currentInventory === this.inventoryName) return

    DefaultPlaceWithInventory.places.forEach(place => {
      // Prevent from self saving
      if (place === this) return

      if (place.inventoryName === currentInventory) {
        place.saveInventory?.(player)
      }
    })

    this.loadInventory(player)
  }

  abstract loadInventory(player: Player): void

  abstract saveInventory?(player: Player): void
}
