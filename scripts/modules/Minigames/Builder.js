import { Player } from '@minecraft/server'
import { LockAction, Sidebar } from 'lib.js'

// TODO Add minigame place

export class Minigame {
  /** @type {Record<string, Minigame>} */
  static instances = {}
  /**
   * @param {Player} player
   */
  static getCurrent(player) {
    return Object.values(this.instances).find(e => e.players.includes(player.id))
  }
  /**
   * @param {Player} player
   */
  static getQuene(player) {
    return Object.values(this.instances).find(e => e.quene.has(player.id))
  }

  /** @type {string[]} */
  players = []

  /** @type {Set<string>} */
  quene = new Set()

  /**
   * Creates new Minigame manager.
   * @param {string} name - Name of the minigame. Needs to stay unique.
   * @param {object} o - Options.
   * @param {Vector3} o.spawn - Minigame spawn
   * @param {Sidebar} o.sidebar
   */
  constructor(name, { spawn, sidebar }) {
    this.name = name
    this.spawn = spawn
    this.sidebar = sidebar

    Minigame.instances[name] = this
  }
}

new LockAction(player => !!Minigame.getQuene(player), `Вы находитесь в очереди миниигры. Выйти: §f.quit`)
