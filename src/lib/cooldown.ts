import { Player } from '@minecraft/server'
import { t } from './text'

export class Cooldown {
  static isExpired(timestamp: number, cooldown: number) {
    return Date.now() - timestamp >= cooldown
  }

  /**
   * Create class for manage player cooldowns
   *
   * @param time - Time in ms
   * @param tell - Whenther to tell player cooldown status or not. Default is `true`
   * @param db - Database to store cooldowns
   */
  constructor(
    private readonly time: number,
    private readonly tell: boolean =  true,
    private db: Record<string, unknown> = {},
  ) {
    this.db = db
  }

  private getElapsed(key: string) {
    const timestamp = this.db[key]
    if (typeof timestamp !== 'number') return 0

    const elapsed = Date.now() - timestamp
    if (elapsed <= this.time) return elapsed

    return 0
  }

  /**
   * Checks if cooldown for player is expired and returns true, otherwise tells player about it if {@link this.tell} is
   * true and returns false
   *
   * @param player - Player to check
   * @returns - Whenether cooldown is expired or not
   */
  isExpired(player: Player) {
    const elapsed = this.getElapsed(player.id)
    if (elapsed) {
      if (this.tell) player.fail(t.error.time`§cПодожди еще §f${this.time - elapsed}`)

      return false
    } else {
      this.db[player.id] = Date.now()

      return true
    }
  }
}
