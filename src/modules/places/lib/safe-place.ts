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
  Vec,
  Vector3Radius,
} from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { emoji } from 'lib/assets/emoji'
import { SharedI18nMessage } from 'lib/i18n/message'
import { i18n, noI18n } from 'lib/i18n/text'
import { SphereArea } from 'lib/region/areas/sphere'
import { RegionEvents } from 'lib/region/events'
import { Group } from 'lib/rpg/place'
import { MultiCost } from 'lib/shop/cost'
import { ErrorCost } from 'lib/shop/cost/cost'
import { Product } from 'lib/shop/product'

export class SafePlace {
  static places: SafePlace[] = []

  readonly group = new Group(this.groupId, this.name)

  private safeAreaLocation = locationWithRadius(this.group.place('safearea').name(noI18n`мирная зона`))

  portalTeleportsTo = locationWithRotation(
    this.group.place('portal teleports to').name(noI18n`портал телепортирует на`),
  )

  private portalFrom = location(this.group.place('portal from').name(noI18n`портал от`), undefined, true)

  private portalTo = location(this.group.place('portal to').name(noI18n`портал до`), undefined, true)

  safeArea?: SafeAreaRegion

  constructor(
    private readonly groupId: string,
    public readonly name: SharedI18nMessage,
  ) {
    this.safeAreaLocation.onLoad.subscribe(location => {
      this.createSafeArea(location)
    })

    // The order doesn't matter because onLoad is being called
    // if location was already loaded and you try to subscribe to it
    this.portalFrom.onLoad.subscribe(from => {
      this.portalTo.onLoad.subscribe(to => {
        this.createPortal(from, to)
      })
    })

    SafePlace.places.push(this)

    this.onCreate()
  }

  protected onCreate() {
    // hook
  }

  private createPortal(from: Vector3, to: Vector3) {
    const start = Vec.min(from, to)
    const end = Vec.max(from, to)
    new Portal(this.group.id, start, end, player => {
      if (!Portal.canTeleport(player)) return

      player.database.unlockedPortals ??= []
      if (!this.isUnlocked(player)) {
        player.success(i18n`Открыт новый портал! [Когда-нибудь здесь будет анимация...]`)
        player.database.unlockedPortals.push(this.groupId)
      }

      portalMenuOnce(player, undefined, this.group, start, end)
    })
  }

  isUnlocked(player: Player) {
    return player.database.unlockedPortals?.includes(this.groupId)
  }

  private createSafeArea(location: Vector3Radius) {
    this.safeArea?.delete()
    this.safeArea = SafeAreaRegion.create(new SphereArea({ center: location, radius: location.radius }, 'overworld'), {
      safeAreaName: this.name,
    })
    RegionEvents.onEnter(this.safeArea, player => {
      if (this.showOnEnterTitle(player)) {
        player.onScreenDisplay.setHudTitle(`§f${this.name.to(player.lang)}`, {
          subtitle: i18n.join`${emoji.shield.green} ${i18n.success`Мирная зона`}`.to(player.lang),
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

const notUnlockedPortalCost = ErrorCost(i18n`Портал в это поселение не разблокирован`)

const portalMenuOnce = debounceMenu(function portalMenu(
  player: Player,
  message?: Text,
  group?: Group,
  from?: Vector3,
  to?: Vector3,
) {
  return new ArrayForm(
    i18n`Перемещение...`,
    SafePlace.places
      .map(e => ({
        location: e.portalTeleportsTo,
        group: e.group,
        unlocked: e.isUnlocked(player),
      }))
      .filter(e => e.location.valid && e.group.id !== group?.id),
  )
    .description(message)
    .button(place => {
      const cost = place.unlocked ? new MultiCost().money(1000) : notUnlockedPortalCost
      const [name, , callback] = Product.create()
        .form(message => portalMenu(player, message, group, from, to))
        .player(player)
        .name(place.group.name ?? 'Unknown')
        .cost(cost)
        .onBuy(() => {
          if (place.location.valid) Portal.teleport(player, place.location, { title: '' })

          system.runTimeout(
            () => Portal.showHudTitle(player, place.group.name?.to(player.lang), 3),
            'teleport title',
            10,
          )

          // Do not open product form on successful teleportation
          return false
        }).button

      return [name, callback]
    })
    .show(player)
    .then(success => {
      // Push player away from portal in case they closed the form
      if (!success && from && to) {
        const direction = from.x === to.x ? 'x' : 'z'
        const distance = player.location[direction] - (from[direction] + 0.5)
        player.applyKnockback({ x: 0, z: 0, [direction]: distance * 5 }, 0.5)
      }
      return success
    })
})

new Command('portals')
  .setDescription(i18n`Порталы`)
  .setPermissions('techAdmin')
  .executes(ctx => portalMenuOnce(ctx.player))
