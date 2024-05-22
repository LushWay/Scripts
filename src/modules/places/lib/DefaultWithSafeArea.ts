import { system } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { SafeAreaRegion, location, locationWithRadius, locationWithRotation, migrateLocationName } from 'lib'
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
    migrateLocationName(name + ' портал телепортирует на', name, 'портал телепортирует на')
    this.portalTeleportsTo = locationWithRotation(name, 'портал телепортирует на')

    migrateLocationName(name + ' портал от', name, 'портал от')
    this.portalPos2 = location(name, 'портал от')

    migrateLocationName(name + ' портал до', name, 'портал до')
    this.portalPos1 = location(name, 'портал до')

    migrateLocationName(name + ' мирная зона', name, 'мирная зона')
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
