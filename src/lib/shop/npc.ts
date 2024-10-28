import { Player, system } from '@minecraft/server'
import { PlaceAction } from 'lib/action'
import { Cooldown } from 'lib/cooldown'
import { ConfigurableLocation, location } from 'lib/location'
import { Npc } from 'lib/rpg/npc'
import { Place } from 'lib/rpg/place'
import { Shop } from './shop'

export interface ShopNpcOptions {
  body: (player: Player) => string
}

export class ShopNpc {
  /** Shop that will be opened on interaction */
  shop: Shop

  /** Npc that is linked with shop */
  npc: Npc

  /**
   * Combines {@link Shop} and {@link Npc} into a signle class and sets Npc's onInteract to open Shop
   *
   * @param options - Creation options
   */
  constructor(protected place: Place) {
    this.shop = new Shop(place.name, place.fullId)
    this.npc = new Npc(place, event => {
      this.shop.open(event.player)
      return true
    })
  }
}

export class ShopBlock {
  shop: Shop

  location: ConfigurableLocation<Vector3>

  private cooldown = new Cooldown(1000, false)

  constructor(place: Place) {
    this.shop = new Shop(place.name, place.fullId)
    this.location = location(place)
    this.location.onLoad.subscribe(location => {
      PlaceAction.onInteract(
        location,
        player => {
          system.delay(() => {
            if (this.cooldown.isExpired(player)) this.shop.open(player)
          })
          return true
        },
        place.group.dimensionId,
      )
    })
  }
}
