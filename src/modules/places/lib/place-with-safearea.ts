import { Player, system, TicksPerSecond } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { actionGuard, location, locationWithRadius, locationWithRotation, SafeAreaRegion } from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { RegionEvents } from 'lib/region/events'
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
      RegionEvents.onEnter(this.safeArea, player => {
        if (this.onEnter(player)) {
          player.onScreenDisplay.setHudTitle('§f' + this.name, {
            subtitle: '§aМирная зона',
            fadeInDuration: 0.5 * TicksPerSecond,
            stayDuration: 3 * TicksPerSecond,
            fadeOutDuration: 2 * TicksPerSecond,
          })
          player.playSound(Sounds['lw.zone_enter'], { volume: 0.2, pitch: 0.9 })
        }
      })
    })

    PlaceWithSafeArea.places.push(this)
  }

  onEnter(player: Player): boolean {
    return true
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
