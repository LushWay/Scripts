import { Player, TeleportOptions, Vector3, system, world } from '@minecraft/server'
import { isEmpty } from 'lib/util'
import { Vec, VecSymbol } from 'lib/vector'
import { EventLoaderWithArg } from './event-signal'
import { i18n, noI18n } from './i18n/text'
import { Place } from './rpg/place'
import { Settings } from './settings'
import { VectorInDimension } from './utils/point'

interface LocationCommon<T extends Vector3> {
  onLoad: Location<T>['onLoad']
  teleport: Location<T>['teleport']
  firstLoad: boolean
  dimensionType: DimensionType
  toPoint: Location<T>['toPoint']
}

export type ValidLocation<T extends Vector3> = { valid: true; toPoint: () => VectorInDimension } & LocationCommon<T> & T

export type InvalidLocation<T extends Vector3> = { valid: false } & LocationCommon<T>

export type ConfigurableLocation<T extends Vector3> = InvalidLocation<T> | ValidLocation<T>

class Location<T extends Vector3> {
  protected static toString(t: Vector3 & object) {
    return Object.values(t).join(' ').trim()
  }

  /**
   * Returns function that creates location
   *
   * @param this - Location type
   * @returns - Function that creates location
   */
  static creator<V extends Vector3, L extends typeof Location<V>>(this: L) {
    /** @param group - Location group */
    return (place: Place, fallback?: V, floor = false) => {
      const location = new this(place.group.id, place.shortId, place.group.dimensionType, fallback, floor)

      const config = (Settings.worldConfigs[place.group.id] ??= {})
      config[place.shortId] = {
        name: place.name,
        description: location.format,
        value: fallback ? Location.toString(fallback) : '',
        required: true,
        onChange: () => location.load(true),
      }

      location.load()
      location.firstLoad = true

      // Set floored value on reload
      if (floor && !Vec.equals(location.location, Vec.zero)) {
        Settings.set(Settings.worldDatabase, place.group.id, place.shortId, Location.toString(location.location))
      }

      return location.safe
    }
  }

  toPoint(): undefined | VectorInDimension {
    if (!this.valid) return
    return {
      location: { x: this.location.x, y: this.location.y, z: this.location.z },
      dimensionType: this.dimensionType,
    }
  }

  protected readonly locationFormat = { x: 0, y: 0, z: 0 } as T

  protected readonly location = Object.assign({}, this.locationFormat)

  protected [VecSymbol] = true

  private get format() {
    return Object.keys(this.locationFormat).join(' ').trim()
  }

  firstLoad = true

  readonly onLoad = new EventLoaderWithArg(this.safe as ValidLocation<T>)

  protected constructor(
    protected group: string,
    protected name: string,
    readonly dimensionType: DimensionType,
    protected fallback?: T,
    protected readonly floor = false,
  ) {}

  private load(throws = false) {
    const raw = Settings.worldDatabase.get(this.group)[this.name]
    if (typeof raw !== 'string' || raw === '') {
      if (this.fallback) this.updateLocation(this.fallback)
      return
    }

    const input = raw.trim().split(' ').map(Number)
    if (input.length !== this.format.split(' ').length || input.some(e => isNaN(e))) {
      const error = new TypeError(noI18n.error`Invalid location, expected '${this.format}' but recieved '${raw}'`)
      if (throws) throw error
      else return console.warn(error)
    }

    const loc = Object.assign({}, this.locationFormat)
    for (const [i, key] of Object.keys(loc).entries()) {
      const n = input[i]
      if (typeof n === 'undefined') throw new TypeError(`I out of bounds: ${i}`)
      ;(loc[key as keyof T] as number) = n
    }
    this.updateLocation(loc)
  }

  private updateLocation(location: T) {
    if (this.floor) {
      const { x, y, z } = Vec.floor(location)
      location = { ...location, x, y, z }
    }
    Object.assign(this.location, location)
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
    return { dimension: world[this.dimensionType] }
  }

  teleport(player: Player) {
    player.teleport(Vec.add(this.location, { x: 0.5, y: 0, z: 0.5 }), this.teleportOptions)
  }
}

export type Vector3Rotation = Vector3 & { xRot: number; yRot: number }

class LocationWithRotation extends Location<Vector3Rotation> {
  protected locationFormat = { x: 0, y: 0, z: 0, xRot: 0, yRot: 0 }

  protected get teleportOptions(): TeleportOptions {
    return { ...super.teleportOptions, rotation: { x: this.location.xRot, y: this.location.yRot } }
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
    console.debug(i18n`Migrating location ${oldGroup}:${oldName} to ${newGroup}:${newName}`)

    Settings.worldDatabase.get(newGroup)[newName] = location

    Reflect.deleteProperty(Settings.worldDatabase.get(oldGroup), oldName)
  } else if (!Settings.worldDatabase.get(newGroup)[newName]) {
    console.warn(
      i18n.error`No location found at ${oldGroup}:${oldName}. Group: ${isEmpty(group) ? [...Settings.worldDatabase.keys()] : Object.keys(group)}`,
    )
  }
}

export function migrateLocationGroup(from: string, to: string) {
  const group = Settings.worldDatabase.get(from)
  if (typeof group !== 'undefined') {
    console.debug(i18n`Migrating group ${from} to ${to}`)

    Settings.worldDatabase.set(to, { ...Settings.worldDatabase.get(to), ...group })

    Settings.worldDatabase.delete(from)
  } else {
    console.warn(
      i18n.error`No group found for migration: ${from} -> ${to}. Groups: ${[...Settings.worldDatabase.keys()]}`,
    )
  }
}
