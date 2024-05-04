import { Player } from '@minecraft/server'
import { util } from 'lib/util.js'

/**
 * @typedef {string
 *   | [string | undefined, string | undefined, string | undefined, string | undefined, string | undefined]} Format
 */

/** @typedef {string | false} SidebarLine */

/**
 * @template E
 * @typedef {(player: Player, extra: E) => SidebarLine} DynamicLine
 */

/**
 * @template E
 * @typedef {{ init(sidebar: Sidebar): DynamicLine<E> }} SidebarLineInit
 */

/**
 * @template E
 * @template [V=DynamicLine<E>] Default is `DynamicLine<E>`
 * @typedef {Record<string, V | string>} SidebarVariables
 */

/**
 * @template E
 * @typedef {SidebarVariables<E, SidebarLineInit<E> | DynamicLine<E>>} SidebarRawVariables
 */

/**
 * Description
 *
 * @template [E=unknown] - Yeah. Default is `unknown`
 */
export class Sidebar {
  /** @type {Sidebar[]} */
  static instances = []

  /**
   * @param {object} o
   * @param {string} o.name
   * @param {(
   *   p: Player,
   *   e: E,
   * ) => {
   *   format: Format
   *   maxWordCount: number
   * }} o.getOptions
   * @param {SidebarRawVariables<E>} content
   */
  constructor({ name, getOptions: getFormat }, content) {
    this.name = name
    this.getOptions = getFormat
    this.content = this.init(content)

    Sidebar.instances.push(this)
  }

  /**
   * @private
   * @param {SidebarRawVariables<E>} content
   * @returns {SidebarVariables<E>}
   */
  init(content) {
    /** @type {SidebarVariables<E>} */
    const base = {}

    for (const [key, e] of Object.entries(content)) {
      if (typeof e === 'object') {
        base[key] = e.init(this)
      } else base[key] = e
    }

    return base
  }

  /**
   * @param {Player} player
   * @param {E} extra
   */
  show(player, extra) {
    const options = this.getOptions(player, extra)
    let content = options.format

    for (const [key, line] of Object.entries(this.content)) {
      let value = typeof line === 'function' ? line(player, extra) : line
      if (value === false) value = ''

      if (Array.isArray(content)) {
        // @ts-expect-error Huh
        content = content.map(e => e?.replaceAll('$' + key, value))
      } else {
        content = content.replaceAll('$' + key, value)
      }
    }

    /** @param {string} line */
    function wrap(line) {
      return line
        .split('\n')
        .map(e => util.wrap(e, options.maxWordCount))
        .flat()
        .join('\n')
    }

    if (Array.isArray(content)) {
      for (const [i, tip] of content.entries()) {
        if (!tip) continue
        const index = i + 1
        if (index !== 1 && index !== 2 && index !== 3 && index !== 4 && index !== 5) continue

        player.onScreenDisplay.setTip(index, wrap(tip))
      }
      player.onScreenDisplay.setSidebar('')
    } else {
      // @ts-expect-error huh
      for (const i of [1, 2, 3, 4, 5]) player.onScreenDisplay.setTip(i, '')
      player.onScreenDisplay.setSidebar(wrap(content))
    }
  }
}

verbose = true
