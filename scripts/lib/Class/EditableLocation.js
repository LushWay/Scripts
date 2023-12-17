import { Player, Vector } from '@minecraft/server'
import { util } from '../util.js'
import { EventLoaderWithArg } from './EventSignal.js'
import { Settings, WORLD_SETTINGS_DB } from './Settings.js'

/**
 * @typedef {'vector3' | 'vector3+rotation' | 'vector3+radius'} LocationTypeSuperset
 */

/**
 * @template {LocationTypeSuperset} LocationType
 * @typedef {LocationType extends 'vector3'
 *   ? Vector3
 *   : LocationType extends 'vector3+rotation'
 *     ? (Vector3 & { xRot: number; yRot: number })
 *     : (Vector3 & { radius: number })
 * } Location
 */

/**
 * @template {LocationTypeSuperset} [LocationType='vector3']
 */
export class EditableLocation {
  // TODO Migrate all locations to safe
  /**
   * @returns {(
   *   { valid: false } |
   *  ({ valid: true } & Location<LocationType>)
   * ) & { onLoad: EditableLocation<LocationType>['onLoad'], teleport: EditableLocation<LocationType>['teleport'] }
   * }
   */
  get safe() {
    return this
  }
  static key = 'locations'
  /**
   * @param {EditableLocation<any>} instance
   * @param {Location<any>} location
   */
  static load(instance, location) {
    instance.x = location.x
    instance.y = location.y
    instance.z = location.z
    if ('xRot' in location) {
      instance.xRot = location.xRot
      instance.yRot = location.yRot
    }
    if ('radius' in location) {
      instance.radius = location.radius
    }
    EventLoaderWithArg.load(instance.onLoad, Object.assign(instance, { firstLoad: !instance.valid }))
  }

  get valid() {
    return this.onLoad.loaded
  }

  /** @type {EventLoaderWithArg<{ firstLoad: boolean } & Location<LocationType>>} */
  // @ts-expect-error Wtf
  onLoad = new EventLoaderWithArg(Object.assign(this, { firstLoad: true }))

  x = 0
  y = 0
  z = 0
  xRot = 0
  yRot = 0
  radius = 0

  /**
   * @private
   * @type {false | Location<LocationType>}
   */
  fallback = false

  /**
   *
   * @param {string} id
   * @param {Object} [options]
   * @param {LocationType} [options.type]
   * @param {EditableLocation<LocationType>["fallback"]} [options.fallback]
   */
  constructor(id, { fallback = false, type } = {}) {
    this.id = id
    /** @type {LocationType} */
    // @ts-expect-error Default type support
    this.type = type ?? 'vector3'
    this.fallback = fallback
    this.format = `x y z${
      this.type === 'vector3+rotation' ? ' xRot yRot' : this.type === 'vector3+radius' ? ' radius' : ''
    }`
    Settings.worldMap[EditableLocation.key][id] = {
      desc: `Позиция ${this.format}`,
      name: id,
      value: fallback ? Vector.string(fallback) : '',
      onChange: () => this.load(),
    }

    this.load()
  }

  /**
   * @private
   */
  load() {
    const raw = WORLD_SETTINGS_DB[EditableLocation.key][this.id]

    if (typeof raw !== 'string' || raw === '') {
      if (this.fallback === false) {
        // Currently disabled warning
        // console.warn(
        //   '§eEmpty location §f' + this.id + '\n§r' + util.error.stack.get(1)
        // )
        return
      } else {
        return EditableLocation.load(this, this.fallback)
      }
    }

    const location = raw.split(' ').map(Number)

    if (location.length !== this.format.split(' ').length) {
      return util.error(
        new TypeError(`Invalid location, expected '${this.format}' but recieved '${util.stringify(raw)}'`)
      )
    }

    const [x, y, z, loc3, loc4] = location
    EditableLocation.load(
      this,
      this.type === 'vector3'
        ? { x, y, z }
        : this.type === 'vector3+rotation'
        ? { x, y, z, yRot: loc4, xRot: loc3 }
        : { x, y, z, radius: loc3 }
    )
  }

  /**
   * @param {Player} player
   */
  teleport(player) {
    player.teleport(
      Vector.add(this, { x: 0.5, y: 0, z: 0.5 }),
      this.type === 'vector3+rotation' ? { rotation: { x: this.xRot, y: this.yRot } } : void 0
    )
  }
}

Settings.worldMap[EditableLocation.key] = {}
