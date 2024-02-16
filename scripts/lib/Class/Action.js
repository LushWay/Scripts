import { Player, Vector, system, world } from '@minecraft/server'
import { actionGuard } from 'lib/Region/index.js'

/**
 * @typedef {'enters' | 'interactions'} PlaceType
 */

/**
 * @typedef {(player: Player) => void} PlayerCallback
 */

export class PlaceAction {
  /**
   * @param {Vector3} place
   * @param {Dimensions} dimension
   */
  static placeId(place, dimension) {
    return Vector.string(place) + dimension
  }
  /**
   * @param {PlaceType} to
   * @param {Vector3} place
   * @param {PlayerCallback} action
   * @param {Dimensions} [dimension]
   */
  static subscribe(to, place, action, dimension = 'overworld') {
    const id = this.placeId(place, dimension)
    this[to][id] ??= new Set()
    this[to][id].add(action)

    return { id, action }
  }
  /**
   * @param {PlaceType} to
   * @param {Vector3} place
   * @param {Player} player
   * @param {Dimensions} dimension
   */
  static emit(to, place, player, dimension) {
    const actions = this[to][this.placeId(place, dimension)]
    if (!actions) return false

    actions.forEach(action => action(player))
    return true
  }
  /**
   * Creates action that triggers function when any player walks into this place.
   * @param {Vector3} place
   * @param {PlayerCallback} action
   * @param {Dimensions} [dimension]
   */
  static onEnter(place, action, dimension) {
    return this.subscribe('enters', place, action, dimension)
  }
  /**
   * @type {Record<string, Set<PlayerCallback>>}
   */
  static enters = {}

  /**
   * Creates action that triggers function when any player interacts with block on this place.
   * @param {Vector3} place
   * @param {PlayerCallback} action
   * @param {Dimensions} [dimension]
   */
  static onInteract(place, action, dimension) {
    return this.subscribe('interactions', place, action, dimension)
  }

  /**
   * @type {Record<string, Set<PlayerCallback>>}
   */
  static interactions = {}

  /** @private */
  static init() {
    world.beforeEvents.playerInteractWithBlock.subscribe(event => {
      if (this.emit('interactions', event.block, event.player, event.player.dimension.type)) event.cancel = true
    })

    system.runPlayerInterval(
      player => this.emit('enters', Vector.floor(player.location), player, player.dimension.type),
      'PlaceAction.enters',
      10
    )

    actionGuard((_player, _region, ctx) => {
      // Allow using any block specified by interaction
      if (
        ctx.type === 'interactWithBlock' &&
        this.placeId(ctx.event.block, ctx.event.block.dimension.type) in this.interactions
      )
        return true
    }, -2)
  }

  /** @protected */
  constructor() {}
}

// @ts-expect-error Private not actually private
PlaceAction.init()

/**
 * @typedef {(player: Player) => boolean | {lockText: string}} LockActionChecker
 */

export class LockAction {
  /** @type {LockAction[]} */
  static instances = []

  /**
   * Creates new locker that can lock other actions
   * @param {LockActionChecker} isLocked - Fn that checks if player is locked
   * @param {string} lockText - Text that returns when player is locked
   */
  constructor(isLocked, lockText) {
    this.isLocked = isLocked
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
  static locked(player, { ignore, accept, tell = true, returnText } = {}) {
    for (const lock of this.instances) {
      if (ignore && ignore.includes(lock)) continue
      if (accept && !accept.includes(lock)) continue
      const isLocked = lock.isLocked(player)
      if (isLocked) {
        const text = typeof isLocked === 'object' ? isLocked.lockText : lock.lockText
        if (tell && player.isValid()) player.fail(text)
        return returnText ? text : true
      }
    }

    return false
  }
}
