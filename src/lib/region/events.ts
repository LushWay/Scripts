import { Player } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { WeakPlayerMap } from 'lib/weak-player-map'
import { Region } from './Region'

export class RegionEvents {
  /**
   * Player map that contains region list that player is currently in. Updated each second by region interval. Used to
   * emit events such as {@link Region.onPlayerRegionsChange}
   */
  static playerInRegionsCache: WeakPlayerMap<Region[]> = new WeakPlayerMap({ removeOnLeave: true })

  /**
   * Event that triggers when player regions have changed. Updated each second by region interval. Uses
   * {@link Region.playerInRegionsCache} under the hood
   */
  static onPlayerRegionsChange: EventSignal<{ player: Player; previous: Region[]; newest: Region[] }> =
    new EventSignal()

  /**
   * Listens for player region changes and triggers a callback when a player enters a specific region.
   *
   * @param region - Represents a specific Region.
   * @param callback - Fnction that will be called when a player enters the specified region.
   */
  static onEnter(region: Region, callback: PlayerCallback) {
    this.onPlayerRegionsChange.subscribe(({ player, newest, previous }) => {
      if (!previous.includes(region) && newest.includes(region)) callback(player)
    })
  }

  protected constructor() {}
}
