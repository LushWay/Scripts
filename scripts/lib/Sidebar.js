import { Player } from '@minecraft/server'
import { util } from 'lib.js'

/** @typedef {string | false} SidebarLine */

/** @typedef {(player: Player) => SidebarLine} DynamicLine */

/** @typedef {{ init(sidebar: Sidebar): DynamicLine }} SidebarLineInit */

/**
 * @template [V=DynamicLine] Default is `DynamicLine`
 * @typedef {Record<string, V | string>} SidebarVariables
 */

/** @typedef {SidebarVariables<SidebarLineInit | DynamicLine>} SidebarRawVariables */

export class Sidebar {
  /** @type {Sidebar[]} */
  static instances = []

  /**
   * @param {object} o
   * @param {string} o.name
   * @param {(p: Player) => { format: string; maxWordCount: number }} o.getOptions
   * @param {SidebarRawVariables} content
   */
  constructor({ name, getOptions: getFormat }, content) {
    this.name = name
    this.getOptions = getFormat
    this.content = this.init(content)

    Sidebar.instances.push(this)
  }

  /**
   * @private
   * @param {SidebarRawVariables} content
   * @returns {SidebarVariables}
   */
  init(content) {
    /** @type {SidebarVariables} */
    const base = {}

    for (const [key, e] of Object.entries(content)) {
      if (typeof e === 'object') {
        base[key] = e.init(this)
      } else base[key] = e
    }

    return base
  }

  /** @param {Player} player */
  show(player) {
    const options = this.getOptions(player)
    let content = options.format

    for (const [key, line] of Object.entries(this.content)) {
      let value = typeof line === 'function' ? line(player) : line
      if (value === false) value = ''

      content = content.replaceAll('$' + key, value)
    }

    content = util.wrap(content, { width: options.maxWordCount })

    player.onScreenDisplay.setSidebar(content)
  }
}
