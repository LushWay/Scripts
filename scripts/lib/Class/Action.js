import { Player, Vector, system } from '@minecraft/server'

export class Place {
  /**
   * Creates action that triggers function when any player gets this place.
   * @param {Vector3} place
   * @param {(player: Player) => void} action
   */
  static action(place, action) {
    const id = Vector.string(place)
    this.actions[id] ??= new Set()
    this.actions[id].add(action)

    return { id, action }
  }
  /** @type {Record<string, Set<(player: Player) => void>>} */
  static actions = {}

  /** @protected */
  constructor() {}
}

system.runPlayerInterval(
  player => {
    const location = Vector.string(Vector.floor(player.location))
    if (Place.actions[location]) {
      Place.actions[location].forEach(a => a(player))
    }
  },
  'Place.action',
  10
)

/**
 * @typedef {(player: Player) => boolean} Fn
 */

export class LockAction {
  /** @type {LockAction[]} */
  static instances = []

  /**
   * Creates new locker that can lock other actions
   * @param {Fn} fn - Fn that checks if player is locked
   * @param {string} lockText - Text that returns when player is locked
   */
  constructor(fn, lockText) {
    this.fn = fn
    this.lockText = lockText

    LockAction.instances.push(this)
  }

  /**
   * Checks if player is locked by any LockerAction and returns first lockText from it
   * @param {Player} player - Player to check
   * @param {object} o
   * @param {LockAction[]} [o.ignore] - Which LockerActions ignore
   * @param {LockAction[]} [o.accept] - Which LockerActions only accept
   * @param {boolean} [o.tell]
   * @param {boolean} [o.returnText] - Return lock text instead of boolean
   */
  static locked(player, { ignore, accept, tell, returnText } = {}) {
    for (const lock of this.instances) {
      if (ignore && ignore.includes(lock)) continue
      if (accept && !accept.includes(lock)) continue
      if (lock.fn(player)) {
        if (tell) player.tell(lock.lockText)
        return returnText ? lock.lockText : true
      }
    }

    return false
  }
}

export class LazyAction {
  whenChunkLoaded() {}

  whenBlockLoaded() {}
}
