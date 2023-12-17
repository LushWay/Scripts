import { Player } from '@minecraft/server'
import { isBuilding } from 'modules/Build/list.js'
import { EditableLocation, SafeAreaRegion } from 'smapi.js'

export class DefaultPlaceWithInventory {
  /**
   * @type {DefaultPlaceWithInventory[]}
   */
  static places = []

  constructor() {
    DefaultPlaceWithInventory.places.push(this)
  }

  /**
   * Loads and saves player inventory
   * @param {Player} player - Player to load
   * @param {VoidFunction} callback - Function that gets executed when inventory actually needs to be loaded
   */
  loadInventory(player, callback) {
    if (isBuilding(player)) return

    const currentInventory = player.database.survival.inv
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

  /**
   * @param {Player} player
   */
  saveInventory(player) {}

  /** @type {Player['database']['survival']['inv']} */
  inventoryName
}

export class DefaultPlaceWithSafeArea {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.portalLocation = new EditableLocation('portal_' + name, { type: 'vector3+rotation' })
    this.location = new EditableLocation(name, { type: 'vector3+radius' })
    this.location.onLoad.subscribe(location => {
      this.safeArea = new SafeAreaRegion({
        key: 'safeArea ' + name,
        dimensionId: 'overworld',
        center: location,
        radius: location.radius,
      })
    })
  }
}
