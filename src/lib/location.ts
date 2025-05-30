import { Player, TeleportOptions, Vector3, system } from '@minecraft/server'
import { isEmpty } from 'lib/util'
import { Vec, VecSymbol } from 'lib/vector'
import { EventLoaderWithArg } from './event-signal'
import { Place } from './rpg/place'
import { Settings } from './settings'
import { t } from './text'

interface LocationCommon<T extends Vector3> {
  onLoad: Location<T>['onLoad']
  teleport: Location<T>['teleport']
  firstLoad: boolean
}

export type ValidLocation<T extends Vector3> = { valid: true } & LocationCommon<T> & T

export type InvalidLocation<T extends Vector3> = { valid: false } & LocationCommon<T>

export type ConfigurableLocation<T extends Vector3> = InvalidLocation<T> | ValidLocation<T>

class Location<T extends Vector3> {
  /**
   * Returns function that creates location
   *
   * @param this - Location type
   * @returns - Function that creates location
   */
  static creator<V extends Vector3, L extends typeof Location<V>>(this: L) {
    /** @param group - Location group */
    return (place: Place, fallback?: V) => {
      const location = new this(place.group.id, place.id, fallback)

      ;(Settings.worldMap[place.group.id] ??= {})[place.id] = {
        name: place.name,
        description: location.format,
        value: fallback ? Object.values(fallback).join(' ').trim() : '',
        onChange: () => location.load(true),
      }

      location.load()
      location.firstLoad = true

      return location.safe
    }
  }

  protected locationFormat = { x: 0, y: 0, z: 0 } as T

  protected location = Object.assign({}, this.locationFormat)

  private [VecSymbol] = true

  private get format() {
    return Object.keys(this.locationFormat).join(' ').trim()
  }

  firstLoad = true

  readonly onLoad = new EventLoaderWithArg(this.safe as ValidLocation<T>)

  protected constructor(
    protected group: string,
    protected name: string,
    protected fallback?: T,
  ) {}

  private load(throws = false) {
    const raw = Settings.worldDatabase.get(this.group)[this.name]
    if (typeof raw !== 'string' || raw === '') {
      if (this.fallback) this.updateLocation(this.fallback)
      return
    }

    const input = raw.trim().split(' ').map(Number)
    if (input.length !== this.format.split(' ').length || input.some(e => isNaN(e))) {
      const error = new TypeError(t.error`Invalid location, expected '${this.format}' but recieved '${raw}'`)
      if (throws) throw error
      else return console.warn(error)
    }

    for (const [i, key] of Object.keys(this.locationFormat).entries()) {
      const n = input[i]
      if (typeof n === 'undefined') throw new TypeError(`I out of bounds: ${i}`)
      ;(this.locationFormat[key as keyof T] as number) = n
    }
    this.updateLocation(this.locationFormat)
  }

  private updateLocation(location: T) {
    this.location = location
    EventLoaderWithArg.load(this.onLoad, this.safe as ValidLocation<T>)
    this.firstLoad = false
  }

  get safe() {
    return Object.setPrototypeOf(this.location, this) as ValidLocation<T> | InvalidLocation<T>
  }

  get valid() {
    return this.onLoad.loaded
  }

  protected get teleportOptions(): TeleportOptions {
    return {}
  }

  teleport(player: Player) {
    player.teleport(Vec.add(this.locationFormat, { x: 0.5, y: 0, z: 0.5 }), this.teleportOptions)
  }
}

export type Vector3Rotation = Vector3 & { xRot: number; yRot: number }

class LocationWithRotation extends Location<Vector3Rotation> {
  protected locationFormat = { x: 0, y: 0, z: 0, xRot: 0, yRot: 0 }

  protected get teleportOptions(): TeleportOptions {
    return { rotation: { x: this.location.xRot, y: this.location.yRot } }
  }
}

export type Vector3Radius = Vector3 & { radius: number }

class LocationWithRadius extends Location<Vector3Radius> {
  protected locationFormat = { x: 0, y: 0, z: 0, radius: 0 }
}

/** Creates reference to a location that can be changed via settings command */
export const location = Location.creator()

/** Creates reference to a location that can be changed via settings command */
export const locationWithRotation = LocationWithRotation.creator<
  Vector3 & { xRot: number; yRot: number },
  typeof LocationWithRotation
>()

/** Creates reference to a location that can be changed via settings command */
export const locationWithRadius = LocationWithRadius.creator<Vector3 & { radius: number }, typeof LocationWithRadius>()

system.delay(() => {
  for (const [k, d] of Settings.worldDatabase.entries()) {
    if (!Object.keys(d).length) {
      Settings.worldDatabase.delete(k)
    }
  }
})

/** Migration helper */
export function migrateLocationName(oldGroup: string, oldName: string, newGroup: string, newName: string) {
  const group = Settings.worldDatabase.get(oldGroup)
  const location = group[oldName]
  if (typeof location !== 'undefined') {
    console.debug(t`Migrating location ${oldGroup}:${oldName} to ${newGroup}:${newName}`)

    Settings.worldDatabase.get(newGroup)[newName] = location

    Reflect.deleteProperty(Settings.worldDatabase.get(oldGroup), oldName)
  } else if (!Settings.worldDatabase.get(newGroup)[newName]) {
    console.warn(
      t.error`No location found at ${oldGroup}:${oldName}. Group: ${isEmpty(group) ? [...Settings.worldDatabase.keys()] : Object.keys(group)}`,
    )
  }
}

export function migrateLocationGroup(from: string, to: string) {
  const group = Settings.worldDatabase.get(from)
  if (typeof group !== 'undefined') {
    console.debug(t`Migrating group ${from} to ${to}`)

    Settings.worldDatabase.set(to, { ...Settings.worldDatabase.get(to), ...group })

    Settings.worldDatabase.delete(from)
  } else {
    console.warn(t.error`No group found for migration: ${from} -> ${to}. Groups: ${[...Settings.worldDatabase.keys()]}`)
  }
}
