import { Player } from '@minecraft/server'
import { util } from './util'

export class Cooldown {
  static expired(timestamp: number, cooldown: number) {
    return Date.now() - timestamp >= cooldown
  }

  /**
   * Generates a unique key for the cooldown in the database
   *
   * @param name - The name of the cooldown
   * @param id - The ID of the player or source related to the cooldown
   * @returns - The generated key
   */

  static genDBkey(name: string, id: string): string {
    return 'COOLDOWN_' + name + ':' + id
  }

  private key: string

  player: Player | undefined

  /**
   * Create class for manage player cooldowns
   *
   * @param db Database to store cooldowns
   * @param prefix Preifx of the cooldown
   * @param source Id or player that used for generate key and tell messages
   * @param time Time in ms
   * @param tell - Whenther to tell player cooldown status or not. Default is `true`
   */

  constructor(
    private db: Record<string, unknown>,
    prefix: string,
    source: string | Player,
    private time: number,
    public tell = true,
  ) {
    this.db = db
    this.key = Cooldown.genDBkey(prefix, typeof source === 'string' ? source : source.id)
    if (typeof source !== 'string') this.player = source
  }

  start() {
    this.db[this.key] = Date.now()
  }

  expire() {
    delete this.db[this.key]
  }

  private get elapsed() {
    const start = this.db[this.key]
    if (typeof start !== 'number') return 0

    const elapsed = Date.now() - start
    if (elapsed <= this.time) return elapsed

    return 0
  }

  get isExpired() {
    return this.elapsed === 0
  }

  tellIfExpired() {
    const elapsed = this.elapsed
    if (!elapsed) return true

    if (this.player && this.tell) {
      const time = util.ms.remaining(this.time - elapsed)
      this.player.fail(`§cПодожди еще §f${time.value} §c${time.type}`)
    }

    return false
  }
}
