import { WeakPlayerMap } from 'lib/weak-player-map'

export const HealthIndicatorConfig = {
  /** Array of player ids who wouldn't get pvp lock */
  disabled: [] as string[],

  lockDisplay: new WeakPlayerMap<number>({ removeOnLeave: true }),
}
