import { WeakPlayerMap } from 'lib/weak-player-storage'

export const HealthIndicatorConfig = {
  /** Array of player ids who wouldn't get pvp lock */
  disabled: [] as string[],

  lockDisplay: new WeakPlayerMap<number>(),
}
