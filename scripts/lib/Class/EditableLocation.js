import { Vector } from '@minecraft/server'
import { EventLoader } from 'smapi.js'
import { util } from '../util.js'
import { Settings, WORLD_SETTINGS_DB } from './Settings.js'

export class EditableLocation {
  static key = 'locations'
  valid = false
  x = 0
  y = 0
  z = 0
  /**
   *
   * @param {string} id
   * @param {Object} [options]
   * @param {false | Vector3} [options.fallback]
   */
  constructor(id, { fallback = false } = {}) {
    this.id = id
    this.fallback = fallback
    Settings.worldMap[EditableLocation.key][id] = {
      desc: `Позиция`,
      name: id,
      value: fallback ? Vector.string(fallback) : '',
      onChange: () => this.init(),
    }

    this.init()
  }

  init() {
    const raw = WORLD_SETTINGS_DB[EditableLocation.key][this.id]

    if (typeof raw !== 'string' || raw === '') {
      if (this.fallback === false) {
        // console.warn(
        //   '§eEmpty location §f' + this.id + '\n§r' + util.error.stack.get(1)
        // )
        this.valid = false
        return
      } else {
        this.x = this.fallback.x
        this.y = this.fallback.y
        this.z = this.fallback.z
        return
      }
    }

    const location = raw.split(' ').map(Number)

    if (location.length !== 3) {
      util.error(new TypeError('Invalid location'))
      console.error(raw)
      this.valid = false
      return
    }

    this.x = location[0]
    this.y = location[1]
    this.z = location[2]
    this.valid = true
    EventLoader.load(this.onValid)
  }

  onValid = new EventLoader()
}
Settings.worldMap[EditableLocation.key] = {}
