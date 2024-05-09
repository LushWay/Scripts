import { system } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { EditableLocation, SafeAreaRegion } from 'lib'
import { actionGuard } from 'lib/Region/index'

export class DefaultPlaceWithSafeArea {
  /** @type {DefaultPlaceWithSafeArea[]} */
  static places = []

  name

  portalPos1

  portalPos2

  portalTeleportsTo

  safeArea

  safeAreaLocation

  /** @param {string} name */
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

    // @ts-expect-error TS(2345) FIXME: Argument of type 'this' is not assignable to param... Remove this comment to see the full error message
    DefaultPlaceWithSafeArea.places.push(this)
  }
}

system.delay(() => {
  // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
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
