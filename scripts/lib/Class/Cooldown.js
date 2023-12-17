import { Player } from '@minecraft/server'
import { util } from '../util.js'

export class Cooldown {
  /**
   * Generates a unique key for the cooldown in the database
   * @param {string} name - The name of the cooldown
   * @param {string} id - The ID of the player or source related to the cooldown
   * @returns {string} - The generated key
   */
  static genDBkey(name, id) {
    return 'COOLDOWN_' + name + ':' + id
  }
  /**
   * @type {Record<string, number>}
   * @private
   */
  db
  /**
   * @type {string}
   * @private
   */
  key
  /**
   * @type {number}
   * @private
   */
  time
  /**
   * @type {Player | undefined}
   */
  player
  /**
   * create class for manage player cooldowns
   * @param {Record<string, any>} db Database to store cooldowns
   * @param {string} prefix Preifx of the cooldown
   * @param {string | Player} source id or player that used for generate key and tell messages
   * @param {number} time Time in ms
   */
  constructor(db, prefix, source, time) {
    this.db = db
    this.key = Cooldown.genDBkey(prefix, typeof source === 'string' ? source : source.id)
    if (typeof source !== 'string') this.player = source
    this.time = time
  }
  update() {
    this.db[this.key] = Date.now()
  }
  get statusTime() {
    const data = this.db[this.key]
    if (typeof data === 'number' && Date.now() - data <= this.time) return Date.now() - data
    return 'EXPIRED'
  }
  isExpired() {
    const status = this.statusTime
    if (status === 'EXPIRED') return true
    if (this.player) {
      const time = util.ms.remaining(this.time - status)
      this.player.tell(`§cПодожди еще §f${time.parsedTime} §c${time.type}`)
    }
    return false
  }
  expire() {
    delete this.db[this.key]
  }
}
