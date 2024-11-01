import { Player, world } from '@minecraft/server'

const id = (player: Player | string) => (player instanceof Player ? player.id : player)

/* Stores values with weak references to player objects, e.g. reference that will be removed when player leaves the world */
export class WeakPlayerMap<T> extends Map<string, T> implements WeakStorageOptions<T> {
  onLeave?: OnLeaveCallback<T>

  onDelete?: OnLeaveCallback<T | undefined>

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
    const playerId = id(player)
    this.onDelete?.(playerId, this.get(playerId))
    return super.delete(playerId)
  }
}

/* Stores values with weak references to player objects, e.g. reference that will be removed when player leaves the world */
export class WeakPlayerSet extends Set<string> {
  onLeave?: OnLeaveCallback<undefined>

  onDelete?: OnLeaveCallback<undefined>

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
    const playerId = id(player)
    this.onDelete?.(playerId, undefined)
    return super.delete(playerId)
  }
}

type WeakStorage = Pick<Map<string, any>, 'has' | 'delete'> &
  Partial<Pick<WeakPlayerMap<any>, 'get' | 'onLeave' | 'onDelete'>>

type OnLeaveCallback<T> = (playerId: string, mapValue: T) => void

interface WeakStorageOptions<T> {
  /** Whenether to remove player from map when it leaves */
  removeOnLeave?: boolean

  /** Callback that will be called when the object is disposed */
  onLeave?: OnLeaveCallback<T>

  /** Callback that will be called when object is removed. May be used to dispose some native objects in the map */
  onDelete?: OnLeaveCallback<T | undefined>
}

function createWeakStorage(storage: WeakStorage, options?: WeakStorageOptions<any>) {
  if (options?.removeOnLeave ?? true) weakStorages.push(storage)
  if (options?.onLeave) storage.onLeave = options.onLeave
  if (options?.onDelete) storage.onDelete = options.onDelete
}

const weakStorages: WeakStorage[] = []

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  for (const map of weakStorages) {
    if (!map.has(playerId)) continue

    map.onLeave?.(playerId, map.get?.(playerId))
    map.delete(playerId)
  }
})
