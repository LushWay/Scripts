import { Player, world } from '@minecraft/server'

/* Stores values with weak references to player objects, e.g. reference that will be removed when player leaves the world */
export class WeakPlayerMap<T> extends Map<string, T> {
  /** Callback that will be called when the object is disposed */
  onLeave?: OnLeaveCallback<T>

  /** Creates new WeakPlayerMap */
  constructor(options?: WeakStorageOptions<T>) {
    super()
    createWeakStorage(this, options)
  }

  get(player: Player | string) {
    return super.get(id(player))
  }

  set(player: Player | string, value: T) {
    return super.set(id(player), value)
  }

  has(player: Player | string) {
    return super.has(id(player))
  }

  delete(player: Player | string) {
    return super.delete(id(player))
  }
}

/* Stores values with weak references to player objects, e.g. reference that will be removed when player leaves the world */
export class WeakPlayerSet extends Set<string> {
  /** Creates new WeakPlayerSet */
  constructor(options?: WeakStorageOptions<undefined>) {
    super()
    createWeakStorage(this, options)
  }

  add(player: Player | string) {
    return super.add(id(player))
  }

  has(player: Player | string) {
    return super.has(id(player))
  }

  delete(player: Player | string) {
    return super.delete(id(player))
  }
}

type WeakStorage = Pick<Map<string, unknown>, 'has' | 'delete'> &
  Partial<Pick<WeakPlayerMap<unknown>, 'get' | 'onLeave'>>

type OnLeaveCallback<T> = (playerId: string, setValue: T) => void

interface WeakStorageOptions<T> {
  /** Whenether to remove player from map when it leaves */
  removeOnLeave?: boolean
  /** Callback that will be called when the object is disposed */
  onLeave?: OnLeaveCallback<T>
}

const id = (player: Player | string) => (player instanceof Player ? player.id : player)

function createWeakStorage(storage: WeakStorage, options?: WeakStorageOptions<unknown>) {
  if (options?.removeOnLeave ?? true) weakStorages.push(storage)
  if (options?.onLeave) storage.onLeave = options.onLeave
}

const weakStorages: WeakStorage[] = []

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  for (const map of weakStorages) {
    if (!map.has(playerId)) continue

    map.onLeave?.(playerId, map.get?.(playerId))
    map.delete(playerId)
  }
})
