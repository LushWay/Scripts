import { system } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { SafeAreaRegion, location, locationWithRadius, locationWithRotation } from 'lib'
import { actionGuard } from 'lib/region/index'

export class DefaultPlaceWithSafeArea {
  static places: DefaultPlaceWithSafeArea[] = []

  name

  portalPos1

  portalPos2

  portalTeleportsTo

  safeArea: SafeAreaRegion

  safeAreaLocation

  constructor(name: string) {
    this.name = name
    this.portalTeleportsTo = locationWithRotation(name, 'портал телепортирует на')
    this.portalPos2 = location(name, 'портал от')
    this.portalPos1 = location(name, 'портал до')
    this.safeAreaLocation = locationWithRadius(name, 'мирная зона')

    this.safeAreaLocation.onLoad.subscribe(location => {
      this.safeArea = SafeAreaRegion.create(
        {
          safeAreaName: name,
          dimensionId: 'overworld',
          center: location,
          radius: location.radius,
        },
        name + ' мирная зона',
      )
    })

    DefaultPlaceWithSafeArea.places.push(this)
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
