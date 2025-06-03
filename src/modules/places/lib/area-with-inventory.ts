import { Player } from '@minecraft/server'
import { isNotPlaying } from 'lib/utils/game'

export abstract class AreaWithInventory {
  static places: AreaWithInventory[] = []

  abstract inventoryName: InventoryTypeName

  constructor() {
    AreaWithInventory.places.push(this)
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

    AreaWithInventory.places.forEach(place => {
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
