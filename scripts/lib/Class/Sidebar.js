import { Player, system, world } from '@minecraft/server'

/**
 * @typedef {string | false} SidebarLine
 */

/**
 * @typedef {(player: Player) => SidebarLine} SidebarLineGenerator
 */

/**
 * @typedef {{ preinit(sidebar: Sidebar): SidebarLineGenerator }} SidebarLinePreinit
 */

export class Sidebar {
  /**
   * @type {Sidebar[]}
   */
  static instances = []

  /**
   * @param {object} o
   * @param {string} o.name
   * @param  {...(SidebarLineGenerator  | SidebarLinePreinit | string)} content
   */
  constructor({ name }, ...content) {
    this.name = name
    /** @type {(SidebarLineGenerator | string | boolean)[]} */
    this.content = content.map(e => (typeof e === 'object' ? ('preinit' in e ? e.preinit(this) : e) : e))

    Sidebar.instances.push(this)
  }

  /**
   * @type {Set<string>}
   */
  players = new Set()

  /**
   *
   * @param {Player} player
   */
  subscribe(player) {
    Sidebar.instances.forEach(e => e.unsubscribe(player))
    this.players.add(player.id)
    this.update(player)
  }

  /**
   *
   * @param {Player | string} player
   */
  unsubscribe(player) {
    this.players.delete(typeof player === 'string' ? player : player.id)
  }

  /**
   * @param {Player} player
   */
  update(player) {
    let content = ''
    for (let line of this.content) {
      if (typeof line === 'function') line = line(player)
      if (line === false) continue
      content += line
      content += '§r\n'
    }
    player.onScreenDisplay.setActionBar(content)
  }

  updateAll() {
    const players = world.getAllPlayers()
    for (const playerId of this.players) {
      const player = players.find(e => e.id === playerId)
      if (!player) {
        this.players.delete(playerId)
        continue
      }

      this.update(player)
    }
  }

  /**
   * @param {number} ticks
   */
  setUpdateInterval(ticks) {
    system.runInterval(() => this.updateAll(), `Sidebar.${this.name}::update`, ticks)
  }
}
