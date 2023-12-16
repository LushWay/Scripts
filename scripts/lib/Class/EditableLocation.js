import { Vector } from '@minecraft/server'
import { EventLoader } from 'smapi.js'
import { util } from '../util.js'
import { Settings, WORLD_SETTINGS_DB } from './Settings.js'

/**
 * @template {boolean} AllowRotation
 * @typedef {(AllowRotation extends false ? Vector3 : (Vector3 & {xRot: number; yRot: number}))} Location
 */

/**
 * @template {boolean} [AllowRotation=false]
 */
export class EditableLocation {
  // TODO Migrate all locations to safe
  /**
   * @returns {({ valid: false } | ({ valid: true } & Location<AllowRotation>))}
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
    if (instance.allowRotation && 'xRot' in location) {
      instance.xRot = location.xRot
      instance.yRot = location.yRot
    }
    EventLoader.load(instance.onLoad)
  }

  get valid() {
    return this.onLoad.loaded
  }

  onLoad = new EventLoader(this)

  x = 0
  y = 0
  z = 0
  xRot = 0
  yRot = 0

  /**
   * @private
   * @type {false | Location<AllowRotation>}
   */
  fallback = false

  /**
   *
   * @param {string} id
   * @param {Object} [options]
   * @param {AllowRotation} [options.allowRotation]
   * @param {EditableLocation<AllowRotation>["fallback"]} [options.fallback]
   */
  constructor(id, { fallback = false, allowRotation } = {}) {
    this.id = id
    this.allowRotation = allowRotation
    this.fallback = fallback
    this.format = `x y z${allowRotation ? ' xRot yRot' : ''}`
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

    const [x, y, z, xRot, yRot] = location
    EditableLocation.load(this, { x, y, z, yRot, xRot })
  }
}

Settings.worldMap[EditableLocation.key] = {}
