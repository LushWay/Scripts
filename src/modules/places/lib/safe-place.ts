import { Player, system, TicksPerSecond } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import {
  actionGuard,
  ActionGuardOrder,
  ArrayForm,
  debounceMenu,
  location,
  locationWithRadius,
  locationWithRotation,
  Portal,
  SafeAreaRegion,
  Vector3Radius,
} from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { SphereArea } from 'lib/region/areas/sphere'
import { RegionEvents } from 'lib/region/events'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { Product } from 'lib/shop/product'
import { MaybeRawText } from 'lib/text'

export class SafePlace {
  static places: SafePlace[] = []

  readonly group = new Group(this.groupId, this.name)

  private safeAreaLocation = locationWithRadius(this.group.point('safearea').name('мирная зона'))

  portalTeleportsTo = locationWithRotation(this.group.point('portal teleports to').name('портал телепортирует на'))

  private portalFrom = location(this.group.point('portal from').name('портал от'))

  private portalTo = location(this.group.point('portal to').name('портал до'))

  safeArea?: SafeAreaRegion

  constructor(
    private readonly groupId: string,
    public readonly name: string,
  ) {
    this.safeAreaLocation.onLoad.subscribe(location => {
      this.createSafeArea(location)
    })

    this.portalFrom.onLoad.subscribe(from => {
      this.portalTo.onLoad.subscribe(to => {
        this.createPortal(from, to)
      })
    })
    this.portalTo.onLoad.subscribe(to => {
      this.portalFrom.onLoad.subscribe(from => {
        this.createPortal(from, to)
      })
    })

    SafePlace.places.push(this)
  }

  private createPortal(from: Vector3, to: Vector3) {
    new Portal(this.group.id, from, to, player => {
      if (!Portal.canTeleport(player)) return

      player.database.unlockedPortals ??= []
      if (!player.database.unlockedPortals.includes(this.groupId)) {
        player.success('Открыт новый портал! [Когда-нибудь здесь будет анимация...]')
        player.database.unlockedPortals.push(this.groupId)
      }

      portalMenuOnce(player, undefined, this.group)
    })
  }

  private createSafeArea(location: Vector3Radius) {
    this.safeArea = SafeAreaRegion.create(new SphereArea({ center: location, radius: location.radius }, 'overworld'), {
      safeAreaName: this.name,
    })
    RegionEvents.onEnter(this.safeArea, player => {
      if (this.showOnEnterTitle(player)) {
        player.onScreenDisplay.setHudTitle(`§f${this.name}`, {
          subtitle: '§aМирная зона',
          fadeInDuration: 0.5 * TicksPerSecond,
          stayDuration: 1 * TicksPerSecond,
          fadeOutDuration: 1 * TicksPerSecond,
        })
        player.playSound(Sounds.ZoneEnter, { volume: 0.2, pitch: 0.9 })
      }
    })
  }

  showOnEnterTitle(player: Player) {
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
  }, ActionGuardOrder.Feature)
})

const portalMenuOnce = debounceMenu(function portalMenu(player: Player, message?: MaybeRawText, group?: Group) {
  return new ArrayForm(
    'Перемещение...',
    SafePlace.places
      .map(e => ({ location: e.portalTeleportsTo, group: e.group }))
      .filter(e => e.location.valid && e.group.id !== group?.id),
  )
    .description(message)
    .button(place => {
      const [name, , callback] = Product.create()
        .form(message => portalMenu(player, message))
        .player(player)
        .name(place.group.name ?? 'Unknown')
        .cost(new MoneyCost(1000))
        .onBuy(() => {
          if (place.location.valid) Portal.teleport(player, place.location, { title: '' })

          system.runTimeout(() => Portal.showHudTitle(player, place.group.name, 3), 'saklds', 10)

          // Do not open form on success teleportation
          return false
        }).button

      return [name, callback]
    })
    .show(player)
})

new Command('portals')
  .setDescription('Порталы')
  .setPermissions('techAdmin')
  .executes(ctx => portalMenuOnce(ctx.player))
