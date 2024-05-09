import { Player } from '@minecraft/server'
import { LockAction, Sidebar } from 'lib'

// TODO Add minigame place

export class Minigame {
  /** @type {Record<string, Minigame>} */
  static instances = {}

  name

  sidebar

  spawn

  /** @param {Player} player */
  static getCurrent(player) {
    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    return Object.values(this.instances).find(e => e.players.includes(player.id))
  }

  /** @param {Player} player */
  static getQuene(player) {
    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    return Object.values(this.instances).find(e => e.quene.has(player.id))
  }

  /** @type {string[]} */
  players = []

  /** @type {Set<string>} */
  quene = new Set()

  /**
   * Creates new Minigame manager.
   *
   * @param {string} name - Name of the minigame. Needs to stay unique.
   * @param {object} o - Options.
   * @param {Vector3} o.spawn - Minigame spawn
   * @param {Sidebar} o.sidebar
   */
  constructor(name, { spawn, sidebar }) {
    this.name = name
    this.spawn = spawn
    this.sidebar = sidebar

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    Minigame.instances[name] = this
  }

  /** @param {Player} player */
  showHud(player) {}
}

new LockAction(player => !!Minigame.getQuene(player), `Вы находитесь в очереди миниигры. Выйти: §f.quit`)
