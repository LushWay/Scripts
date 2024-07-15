 
import { ContainerSlot, EquipmentSlot, Player, system } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { actionGuard } from 'lib/region/index'
import { Vector } from 'lib/vector'

type PlaceType = 'enters' | 'interactions'

type PlayerCallback = (player: Player) => void

export class PlaceAction {
  private static placeId(place: Vector3, dimension: Dimensions) {
    return Vector.string(Vector.floor(place)) + ' ' + dimension
  }

  static subscribe(type: PlaceType, place: Vector3, action: PlayerCallback, dimension: Dimensions = 'overworld') {
    const id = this.placeId(place, dimension)

    if (!this[type].has(id)) this[type].set(id, new Set())
    this[type].get(id)?.add(action)

    return {
      id,
      action,
      unsubscribe: () => {
        this[type].get(id)?.delete(action)
        if (this[type].get(id)?.size === 0) this[type].delete(id)
      },
    }
  }

  private static emit(to: PlaceType, place: Vector3, player: Player, dimension: Dimensions) {
    const actions = this[to].get(this.placeId(place, dimension))
    if (!actions) return false

    actions.forEach(action => action(player))
    return true
  }

  /** Creates action that triggers function when any player walks into this place. */
  static onEnter(place: Vector3, action: PlayerCallback, dimension?: Dimensions) {
    return this.subscribe('enters', place, action, dimension)
  }

  private static enters = new Map<string, Set<PlayerCallback>>()

  /** Creates action that triggers function when any player interacts with block on this place. */
  static onInteract(place: Vector3, action: PlayerCallback, dimension: Dimensions) {
    return this.subscribe('interactions', place, action, dimension)
  }

  private static interactions = new Map<string, Set<PlayerCallback>>()

  static {
    system.runPlayerInterval(
      player => this.emit('enters', Vector.floor(player.location), player, player.dimension.type),
      'PlaceAction.enters',
      10,
    )

    actionGuard((_player, _region, ctx) => {
      // Allow using any block specified by interaction
      if (
        ctx.type === 'interactWithBlock' &&
        this.emit('interactions', ctx.event.block, ctx.event.player, ctx.event.player.dimension.type)
      ) {
        return false
      }
    }, 100000)
  }
}

type LockActionChecker = (player: Player) => boolean | { lockText: string }

export class LockAction {
  /** List of all existing lock actions */
  private static instances: LockAction[] = []

  isLocked

  lockText

  /**
   * Checks if player is locked by any LockerAction and returns first lockText from it
   *
   * @param {Player} player - Player to check
   * @param {object} o
   * @param {LockAction[]} [o.ignore] - Which LockerActions ignore
   * @param {LockAction[]} [o.accept] - Which LockerActions only accept
   * @param {boolean} [o.tell]
   * @param {boolean} [o.returnText] - Return lock text instead of boolean
   */
  static locked(
    player: Player,
    {
      ignore,
      accept,
      tell = true,
      returnText,
    }: { ignore?: LockAction[]; accept?: LockAction[]; tell?: boolean; returnText?: boolean } = {},
  ) {
    for (const lock of this.instances) {
      if (ignore?.includes(lock)) continue
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
   *
   * @param isLocked - Fn that checks if player is locked
   * @param lockText - Text that returns when player is locked
   */
  constructor(isLocked: LockActionChecker, lockText: string) {
    this.isLocked = isLocked
    this.lockText = lockText

    LockAction.instances.push(this)
  }
}

export class InventoryInterval {
  static slots = new EventSignal<{ player: Player; slot: ContainerSlot; i: number }>()

  static mainhand = new EventSignal<{ player: Player; slot: ContainerSlot }>()

  static offhand = new EventSignal<{ player: Player; slot: ContainerSlot }>()

  static {
    system.runPlayerInterval(
      player => {
        if (!player.isValid()) return

        const { container } = player
        if (!container) return

        const selectedSlot = player.selectedSlotIndex
        for (const [i, slot] of container.slotEntries()) {
          if (i === selectedSlot) EventSignal.emit(this.mainhand, { player, slot })
          EventSignal.emit(this.slots, { player, slot, i })
        }

        const offhand = player.getComponent('equippable')?.getEquipmentSlot(EquipmentSlot.Offhand)
        if (offhand) EventSignal.emit(this.offhand, { player, slot: offhand })
      },
      'InventoryIntervalAction',
      5,
    )
  }
}
