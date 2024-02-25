import { ContainerSlot, Player, Vector, system, world } from '@minecraft/server'
import { util } from 'lib.js'
import { EventSignal } from 'lib/EventSignal.js'
import { actionGuard } from 'lib/Region/index.js'

/**
 * @typedef {'enters' | 'interactions'} PlaceType
 */

/**
 * @typedef {(player: Player) => void} PlayerCallback
 */

export class PlaceAction {
  /**
   * @private
   * @param {Vector3} place
   * @param {Dimensions} dimension
   */
  static placeId(place, dimension) {
    return Vector.string(place) + dimension
  }
  /**
   * @param {PlaceType} type
   * @param {Vector3} place
   * @param {PlayerCallback} action
   * @param {Dimensions} [dimension]
   */
  static subscribe(type, place, action, dimension = 'overworld') {
    const id = this.placeId(place, dimension)
    this[type][id] ??= new Set()
    this[type][id].add(action)

    return {
      id,
      action,
      unsubscribe() {
        PlaceAction[type][id].delete(action)
        if (PlaceAction[type][id].size === 0) delete PlaceAction[type][id]
      },
    }
  }
  /**
   * @private
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
   * @private
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
   * @private
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

/**
 * @typedef {(player: Player) => boolean | {lockText: string}} LockActionChecker
 */

export class LockAction {
  /**
   * List of all existing lock actions
   * @private
   * @type {LockAction[]}
   */
  static instances = []

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
}

export class InventoryIntervalAction {
  /**
   * @private
   * @type {EventSignal<{ player: Player, slot: ContainerSlot, i: number }>}
   */
  static signal = new EventSignal()

  static subscribe = EventSignal.bound(this.signal).subscribe
  static unsubscribe = EventSignal.bound(this.signal).unsubscribe

  /** @private */
  static init() {
    system.runPlayerInterval(
      player => {
        util.catch(async () => {
          if (!player.isValid()) return

          const { container } = player
          if (!container) return

          const selectedSlot = player.selectedSlot

          for (const [i, slot] of container.slotEntries()) {
            if (i === selectedSlot) EventSignal.emit(MainhandIntervalAction.signal, { player, slot })
            EventSignal.emit(this.signal, { player, slot, i })
          }

          await nextTick
        })
      },
      'InventoryIntervalAction',
      1
    )
  }
}

export class MainhandIntervalAction {
  /**
   * @type {EventSignal<{ player: Player, slot: ContainerSlot }>}
   */
  static signal = new EventSignal()

  static subscribe = EventSignal.bound(this.signal).subscribe
  static unsubscribe = EventSignal.bound(this.signal).subscribe
}

const toInitialize = [PlaceAction, InventoryIntervalAction]

for (const cls of toInitialize) {
  // @ts-expect-error Since static init blocks are not supported
  // we're using private init method
  cls.init()
}
