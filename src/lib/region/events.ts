import { Player } from '@minecraft/server'
import { EventLoader, EventSignal } from 'lib/event-signal'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { Region } from './kinds/region'

export class RegionEvents {
  /**
   * Player map that contains region list that player is currently in. Updated each second by region interval. Used to
   * emit events such as {@link RegionEvents.onPlayerRegionsChange}
   */
  static playerInRegionsCache = new WeakPlayerMap<Region[]>()

  /** Event that triggers each second and is used to update player region cache */
  static onInterval = new EventSignal<{ player: Player; currentRegion: Region | undefined }>()

  /**
   * Event that triggers when player regions have changed. Updated each second by region interval. Uses
   * {@link RegionEvents.playerInRegionsCache} under the hood
   */
  static onPlayerRegionsChange = new EventSignal<{ player: Player; previous: Region[]; newest: Region[] }>()

  /**
   * Listens for player region changes and triggers a callback when a player enters a specific region.
   *
   * @param region - Represents a specific Region.
   * @param callback - Fnction that will be called when a player enters the specified region.
   */
  static onEnter(region: Region, callback: PlayerCallback) {
    const event = this.onPlayerRegionsChange.subscribe(({ player, newest, previous }) => {
      if (!previous.includes(region) && newest.includes(region)) callback(player)
    })

    return () => this.onPlayerRegionsChange.unsubscribe(event)
  }

  /** Event that triggers once all regions have loaded */
  static onLoad = new EventLoader()
}
