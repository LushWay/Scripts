import { ContainerSlot, EquipmentSlot, Player, system } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { actionGuard, ActionGuardOrder } from 'lib/region/index'
import { Vec } from 'lib/vector'
import { Items } from './assets/custom-items'
import { onPlayerMove } from './player-move'

type PlaceType = 'enters' | 'interactions'

export class PlaceAction {
  private static placeId(place: Vector3, dimension: DimensionType) {
    return Vec.string(Vec.floor(place)) + ' ' + dimension
  }

  static subscribe(type: PlaceType, place: Vector3, action: PlayerCallback, dimension: DimensionType = 'overworld') {
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

  private static emit(to: PlaceType, place: Vector3, player: Player, dimension: DimensionType) {
    const actions = this[to].get(this.placeId(place, dimension))
    if (!actions) return false

    actions.forEach(action => action(player))
    return true
  }

  /** Creates action that triggers function when any player walks into this place. */
  static onEnter(place: Vector3, action: PlayerCallback, dimension?: DimensionType) {
    return this.subscribe('enters', place, action, dimension)
  }

  private static enters = new Map<string, Set<PlayerCallback>>()

  /** Creates action that triggers function when any player interacts with block on this place. */
  static onInteract(place: Vector3, action: PlayerCallback, dimension: DimensionType) {
    return this.subscribe('interactions', place, action, dimension)
  }

  private static interactions = new Map<string, Set<PlayerCallback>>()

  static {
    onPlayerMove.subscribe(({ player, location, dimensionType }) =>
      this.emit('enters', location, player, dimensionType),
    )

    actionGuard((_player, _region, ctx) => {
      // Allow using any block specified by interaction
      if (
        ctx.type === 'interactWithBlock' &&
        (!ctx.event.itemStack || ctx.event.itemStack.typeId !== Items.WeDebugstick) &&
        this.emit('interactions', ctx.event.block, ctx.event.player, ctx.event.player.dimension.type)
      ) {
        return false
      }
    }, ActionGuardOrder.BlockAction)
  }
}

type LockActionFunction = (player: Player) => boolean | { lockText: Text }

export interface LockActionCheckOptions {
  ignore?: LockAction[]
  accept?: LockAction[]
  tell?: boolean
  returnText?: boolean
}

export class LockAction {
  /** List of all existing lock actions */
  private static instances: LockAction[] = []

  /**
   * Checks if player is locked by any LockerAction and returns first lockText from it
   *
   * @param {Player} player - Player to check
   * @param {LockAction[]} [o.ignore] - Which LockerActions ignore
   * @param {LockAction[]} [o.accept] - Which LockerActions only accept
   * @param {boolean} [o.returnText] - Return lock text instead of boolean
   */
  static locked(player: Player, { ignore, accept, tell = true, returnText }: LockActionCheckOptions = {}) {
    for (const lock of this.instances) {
      if (ignore?.includes(lock)) continue
      if (accept && !accept.includes(lock)) continue

      const isLocked = lock.isLocked(player)
      if (isLocked) {
        const text = typeof isLocked === 'object' ? isLocked.lockText : lock.lockText
        if (tell && player.isValid) player.fail(text)
        return returnText ? text : true
      }
    }

    return false
  }

  /** Creates new locker that can lock other actions */
  constructor(
    /** Function that checks if player is being locked */
    readonly isLocked: LockActionFunction,
    /** Text that returns when player is locked */
    readonly lockText: Text,
  ) {
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
        if (!player.isValid) return

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
