import { Player } from '@minecraft/server'

/**
 * @typedef {string | false} SidebarLine
 */

/**
 * @typedef {(player: Player) => SidebarLine} DynamicLine
 */

/**
 * @typedef {{ preinit(sidebar: Sidebar): DynamicLine }} SidebarLinePreinit
 */

/**
 * @template [V=DynamicLine]
 * @typedef {Record<string, V | string>} SidebarVariables
 */

/**
 * @typedef {SidebarVariables<SidebarLinePreinit | DynamicLine>} SidebarInputedVariables
 */

export class Sidebar {
  /**
   * @type {Sidebar[]}
   */
  static instances = []

  /**
   * @param {object} o
   * @param {string} o.name
   * @param {(p: Player) => string} o.getFormat
   * @param  {SidebarInputedVariables} content
   */
  constructor({ name, getFormat }, content) {
    this.name = name
    this.getFormat = getFormat
    this.content = this.preinit(content)

    Sidebar.instances.push(this)
  }

  /**
   * @param {SidebarInputedVariables} content
   * @returns {SidebarVariables}
   */
  preinit(content) {
    return Object.entries(content).reduce((prev, [key, e]) => {
      if (typeof e === 'object' && 'preinit' in e) {
        content[key] = e.preinit(this)
      } else content[key] = e
      return prev
    }, {})
  }

  /**
   * @param {Player} player
   */
  show(player) {
    let content = this.getFormat(player)
    for (const [key, line] of Object.entries(this.content)) {
      /** @type {string | boolean} */
      let value = ''
      if (typeof line === 'function') value = line(player)
      else value = line
      if (value === false) continue

      content = content.replaceAll('$' + key, value)
    }
    player.onScreenDisplay.setActionBar(content)
  }
}
