import { Player, Vector } from '@minecraft/server'
import { LockAction, PlaceAction } from 'lib/Action.js'

/**
 * @typedef {object} TeleportOptions
 * @prop {Parameters<typeof LockAction['locked']>[1]} [lockActionOptions]
 * @prop {string} [place]
 * @prop {boolean} [fadeScreen=true]
 */

export class Portal {
  /**
   *
   * @param {Player} player
   * @param {TeleportOptions} [options]
   */
  static canTeleport(player, { fadeScreen = true, lockActionOptions, place } = {}) {
    if (LockAction.locked(player, lockActionOptions)) return false

    if (fadeScreen) {
      const inS = 0
      const stayS = 2.0
      const outS = 1.0
      player.onScreenDisplay.setHudTitle(place ?? '§aShp1nat§6Mine', {
        fadeInDuration: inS * 20,
        stayDuration: stayS * 20,
        fadeOutDuration: outS * 20,
        subtitle: '§2Перемещение...',
      })
      const red = 10
      const green = 20
      const blue = 10
      // #102010

      player.runCommand(`camera @s fade time ${inS} ${stayS} ${outS} color ${red} ${green} ${blue}`)
    }

    return true
  }
  /**
   *
   * @param {Player} player
   * @param {Vector3} to
   * @param {TeleportOptions} [options]
   */
  static teleport(player, to, options = {}) {
    if (this.canTeleport(player, options)) player.teleport(to)
  }
  /**
   * Creates new portal.
   * @param {string} name
   * @param {Vector3 | null} from
   * @param {Vector3 | null} to
   * @param {Vector3 | ((player: Player) => void)} place
   * @param {object} [o]
   * @param {string[]} [o.aliases]
   * @param {boolean} [o.createCommand]
   * @param {string} [o.commandDescription]
   */
  constructor(name, from, to, place, { aliases = [], createCommand = true, commandDescription } = {}) {
    // console.debug('Portal init', name, { from: from ? Vector.string(from) : from, to: to ? Vector.string(to) : to })
    this.from = from
    this.to = to
    if (typeof place === 'function') {
      this.teleport = place
    } else this.place = place

    if (createCommand)
      this.command = new Command({
        name,
        aliases,
        description: commandDescription ?? `§bТелепорт на ${name}`,
        type: 'public',
      }).executes(ctx => {
        this.teleport(ctx.sender)
      })

    if (from && to) {
      for (const pos of Vector.foreach(from, to)) {
        PlaceAction.onEnter(pos, p => this.teleport(p))
      }
    }
  }
  /**
   * @param {Player} player
   */
  teleport(player) {
    if (this.place) Portal.teleport(player, this.place)
  }
}
