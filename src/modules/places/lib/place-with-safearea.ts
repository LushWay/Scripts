import { system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { SafeAreaRegion, Settings, actionGuard, location, locationWithRadius, locationWithRotation } from 'lib'

export class PlaceWithSafeArea {
  static places: PlaceWithSafeArea[] = []

  portalPos1

  portalPos2

  portalTeleportsTo

  safeArea?: SafeAreaRegion

  safeAreaLocation

  constructor(
    public readonly group: string,
    public readonly name: string,
  ) {
    // Define settings group name
    Settings.world(name, group, {})

    this.safeAreaLocation = locationWithRadius(group, 'safearea', 'мирная зона')
    this.portalTeleportsTo = locationWithRotation(group, 'portal teleports to', 'портал телепортирует на')
    this.portalPos2 = location(group, 'portal from', 'портал от')
    this.portalPos1 = location(group, 'portal to', 'портал до')

    this.safeAreaLocation.onLoad.subscribe(location => {
      this.safeArea = SafeAreaRegion.create(
        {
          safeAreaName: name,
          dimensionId: 'overworld',
          center: location,
          radius: location.radius,
        },
        group + ' safe area',
      )
    })

    PlaceWithSafeArea.places.push(this)
  }
}

system.delay(() => {
  actionGuard((_, region, ctx) => {
    if (
      ctx.type === 'interactWithBlock' &&
      region instanceof SafeAreaRegion &&
      ctx.event.block.typeId === MinecraftBlockTypes.CraftingTable &&
      region.allowUsageOfCraftingTable
    ) {
      return true
    }
  })
})
