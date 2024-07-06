import { system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { SafeAreaRegion, actionGuard, location, locationWithRadius, locationWithRotation } from 'lib'
import { Group } from 'lib/rpg/place'

export class PlaceWithSafeArea {
  static places: PlaceWithSafeArea[] = []

  portalPos1

  portalPos2

  portalTeleportsTo

  safeArea?: SafeAreaRegion

  safeAreaLocation

  readonly group: Group

  constructor(
    group: string,
    public readonly name: string,
  ) {
    this.group = new Group(group, name)
    this.safeAreaLocation = locationWithRadius(this.group.point('safearea').name('мирная зона'))
    this.portalTeleportsTo = locationWithRotation(
      this.group.point('portal teleports to').name('портал телепортирует на'),
    )
    this.portalPos2 = location(this.group.point('portal from').name('портал от'))
    this.portalPos1 = location(this.group.point('portal to').name('портал до'))

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
