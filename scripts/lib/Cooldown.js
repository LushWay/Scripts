import { Player } from '@minecraft/server'
import { util } from './util.js'

export class Cooldown {
  /**
   * @param {number} timestamp
   * @param {number} cooldown
   */
  static expired(timestamp, cooldown) {
    return Date.now() - timestamp >= cooldown
  }
  /**
   * Generates a unique key for the cooldown in the database
   *
   * @param {string} name - The name of the cooldown
   * @param {string} id - The ID of the player or source related to the cooldown
   * @returns {string} - The generated key
   */
  static genDBkey(name, id) {
    return 'COOLDOWN_' + name + ':' + id
  }
  /**
   * @private
   * @type {Record<string, number>}
   */
  db
  /**
   * @private
   * @type {string}
   */
  key
  /**
   * @private
   * @type {number}
   */
  time
  /** @type {Player | undefined} */
  player
  /**
   * Create class for manage player cooldowns
   *
   * @param {Record<string, any>} db Database to store cooldowns
   * @param {string} prefix Preifx of the cooldown
   * @param {string | Player} source Id or player that used for generate key and tell messages
   * @param {number} time Time in ms
   * @param {boolean} [tell=true] - Whenther to tell player cooldown status or not. Default is `true`
   */
  constructor(db, prefix, source, time, tell = true) {
    this.db = db
    this.tell = tell
    this.time = time
    this.key = Cooldown.genDBkey(prefix, typeof source === 'string' ? source : source.id)
    if (typeof source !== 'string') this.player = source
  }
  update() {
    this.db[this.key] = Date.now()
  }
  get status() {
    const startTime = this.db[this.key]
    if (typeof startTime === 'number') {
      const elapsed = Date.now() - startTime

      // Not expired, return time
      if (elapsed <= this.time) return elapsed
    }
    return 'EXPIRED'
  }
  tellIfExpired() {
    const status = this.status
    if (status === 'EXPIRED') return true
    if (this.player && this.tell) {
      const time = util.ms.remaining(this.time - status)
      this.player.fail(`§cПодожди еще §f${time.value} §c${time.type}`)
    }
    return false
  }
  expire() {
    delete this.db[this.key]
  }
}
