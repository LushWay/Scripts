import { system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { EditableLocation, SafeAreaRegion } from 'lib.js'
import { actionGuard } from 'lib/Region/index.js'

export class DefaultPlaceWithSafeArea {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name
    this.portalTeleportsTo = new EditableLocation(name + ' портал телепортирует на', { type: 'vector3+rotation' }).safe
    this.portalPos2 = new EditableLocation(name + ' портал от', { type: 'vector3' }).safe
    this.portalPos1 = new EditableLocation(name + ' портал до', { type: 'vector3' }).safe
    this.safeAreaLocation = new EditableLocation(name + ' мирная зона', { type: 'vector3+radius' }).safe
    this.safeAreaLocation.onLoad.subscribe(location => {
      this.safeArea = new SafeAreaRegion({
        name,
        key: name + ' мирная зона',
        dimensionId: 'overworld',
        center: location,
        radius: location.radius,
      })
    })
  }
}

system.delay(() => {
  actionGuard((_, region, ctx) => {
    if (
      ctx.type === 'interactWithBlock' &&
      ctx.event.block.typeId === MinecraftBlockTypes.CraftingTable &&
      region instanceof SafeAreaRegion &&
      region.allowUsageOfCraftingTable
    ) {
      return true
    }
  })
})
