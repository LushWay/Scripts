import { Player, TeleportOptions, Vector3 } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { EventLoaderWithArg } from './event-signal'
import { Settings } from './settings'
import { util } from './util'

/** Creates reference to a location that can be changed via settings command */
export function location(group: string, name: string, fallback?: Vector3) {
  return Location.create(group, name, fallback)
}

/** Creates reference to a location that can be changed via settings command */
export function locationWithRotation(group: string, name: string, fallback?: LocationWithRotation['locationFormat']) {
  return LocationWithRotation.create(group, name, fallback)
}

/** Creates reference to a location that can be changed via settings command */
export function locationWithRadius(group: string, name: string, fallback?: LocationWithRadius['locationFormat']) {
  return LocationWithRadius.create(group, name, fallback)
}
// console.log('All names:', Settings.worldDatabase['locations'])

/** Migration helper */
export function migrateLocationName(oldName: string, newGroup: string, newName: string) {
  const oldvalue = Settings.worldDatabase.locations[oldName]
  if (oldvalue) {
    console.log(`§7[LocationNameMigration] Renaming '§f${oldName}§7' to '§f${newGroup} - ${newName}§7'`)
    Settings.worldDatabase[newGroup][newName] = oldvalue
    Reflect.deleteProperty(Settings.worldDatabase.locations, oldName)
  } else if (!Settings.worldDatabase[newGroup][newName]) {
    console.warn(`§7[LocationNameMigration] No rename for '§f${oldName}§7'`)
  }
}

interface SafeLocationCommon<T extends Vector3> {
  onLoad: Location<T>['onLoad']
  teleport: Location<T>['teleport']
  firstLoad: boolean
}

export type ValidSafeLocation<T extends Vector3> = {
  valid: true
} & SafeLocationCommon<T> &
  T

export type InvalidSafeLocation<T extends Vector3> = {
  valid: false
} & SafeLocationCommon<T>

export type SafeLocation<T extends Vector3> = InvalidSafeLocation<T> | ValidSafeLocation<T>

class Location<T extends Vector3> {
  static create<V extends Vector3, T extends typeof Location<V>>(this: T, group: string, name: string, fallback?: V) {
    const location = new this(group, name, fallback)
    Settings.worldMap[group] ??= {}
    Settings.worldMap[group][name] = {
      name,
      description: location.format,
      value: fallback ? Object.values(fallback).join(' ').trim() : '',
      onChange: () => location.load(true),
    }

    location.load()
    location.firstLoad = true

    return location.safe
  }

  protected locationFormat = { x: 0, y: 0, z: 0 } as T

  protected location = Object.assign({}, this.locationFormat)

  private get format() {
    return Object.keys(this.locationFormat).join(' ').trim()
  }

  firstLoad = true

  readonly onLoad = new EventLoaderWithArg(this.safe as ValidSafeLocation<T>)

  protected constructor(
    protected group: string,
    protected name: string,
    protected fallback?: T,
  ) {}

  private load(throws = false) {
    const raw = Settings.worldDatabase[this.group][this.name]
    if (typeof raw !== 'string' || raw === '') {
      if (this.fallback) this.updateLocation(this.fallback)
      return
    }

    const input = raw.trim().split(' ').map(Number)
    if (input.length !== this.format.split(' ').length || input.some(e => isNaN(e))) {
      const error = new TypeError(`Invalid location, expected '${this.format}' but recieved '${util.stringify(raw)}'`)
      if (throws) throw error
      else return console.warn(error)
    }

    for (const [i, key] of Object.keys(this.locationFormat).entries()) {
      ;(this.locationFormat[key as keyof T] as number) = input[i]
    }
    this.updateLocation(this.locationFormat)
  }

  private updateLocation(location: T) {
    this.location = location
    EventLoaderWithArg.load(this.onLoad, this.safe as ValidSafeLocation<T>)
    this.firstLoad = false
  }

  get safe() {
    return Object.setPrototypeOf(this.location, this) as ValidSafeLocation<T> | InvalidSafeLocation<T>
  }

  get valid() {
    return this.onLoad.loaded
  }

  protected get teleportOptions(): TeleportOptions {
    return {}
  }

  teleport(player: Player) {
    player.teleport(Vector.add(this.locationFormat, { x: 0.5, y: 0, z: 0.5 }), this.teleportOptions)
  }
}

class LocationWithRotation extends Location<Vector3 & { xRot: number; yRot: number }> {
  protected locationFormat = { x: 0, y: 0, z: 0, xRot: 0, yRot: 0 }

  protected get teleportOptions(): TeleportOptions {
    return { rotation: { x: this.location.xRot, y: this.location.yRot } }
  }
}

class LocationWithRadius extends Location<Vector3 & { radius: number }> {
  protected locationFormat = { x: 0, y: 0, z: 0, radius: 0 }
}
