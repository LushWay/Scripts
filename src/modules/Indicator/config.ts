export class HealthIndicatorConfig {
  /** Array of player ids who wouldn't get pvp lock */
  static disabled: string[] = []

  static lockDisplay: Record<string, number> = {}
}
