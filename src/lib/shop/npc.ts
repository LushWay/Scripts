import { Player, system } from '@minecraft/server'
import { PlaceAction } from 'lib/action'
import { Cooldown } from 'lib/cooldown'
import { SafeLocation, location } from 'lib/location'
import { Npc, NpcOptions } from 'lib/rpg/npc'
import { Shop } from './shop'

export interface ShopNpcOptions extends Omit<NpcOptions, 'onInteract'> {
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
  constructor(options: ShopNpcOptions) {
    this.shop = new Shop(options.name)
    this.npc = new Npc({
      ...options,
      onInteract: event => this.shop.open(event.player),
    })
  }
}

export class ShopBlock {
  shop: Shop

  location: SafeLocation<Vector3>

  private cooldown = new Cooldown(1000, false)

  constructor(options: ShopNpcOptions) {
    this.shop = new Shop(options.name)
    this.location = location(options.group, options.id, options.name)
    this.location.onLoad.subscribe(location => {
      PlaceAction.onInteract(
        location,
        player => {
          system.delay(() => {
            if (this.cooldown.isExpired(player)) this.shop.open(player)
          })
          return true
        },
        options.dimensionId ?? 'overworld',
      )
    })
  }
}
