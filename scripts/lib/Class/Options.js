import { Player, Vector } from '@minecraft/server'
import { DPDBProxy } from 'lib/Database/Properties.js'
import { util } from '../util.js'

export const OPTIONS_NAME = Symbol('name')

/**
 * Сonverting true and false to boolean
 * @template T
 * @typedef {T extends true | false ? boolean : T} Normalize
 */

/**
 * @typedef {string | boolean | number | JSONLike} OptionValue
 */

/**
 * @template [T = boolean | string | number]
 * @typedef {Record<string, { desc: string; value: T, name: string }> & {[OPTIONS_NAME]?: string}} DefaultOptions
 */

/** @typedef {Record<string, Record<string, OptionValue>>} OPTIONS_DB */
/** @type {OPTIONS_DB} */
const PLAYER_DB = DPDBProxy('player', {
  defaultValue: () => {
    return {}
  },
})

/** @typedef {DefaultOptions<OptionValue> & Record<string, { requires?: boolean }>} WorldOptions */
/** @type {OPTIONS_DB} */
const WORLD_OPTIONS_DB = DPDBProxy('options', {
  defaultValue: () => {
    return {}
  },
})

export class Options {
  /** @type {Record<string, DefaultOptions<boolean>>} */
  static PLAYER = {}
  /**
   * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are
   * stored in a database
   * @template {DefaultOptions<boolean>} Config
   * @param {string} name - The name that shows to players
   * @param {string} prefix - The prefix for the database.
   * @param {Config} CONFIG - This is an object that contains the default values for each option.
   * @returns {(player: Player) => { [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
   */
  static player(name, prefix, CONFIG) {
    CONFIG[OPTIONS_NAME] = name

    if (!(prefix in this.PLAYER)) {
      this.PLAYER[prefix] = CONFIG
    } else {
      this.PLAYER[prefix] = {
        ...this.PLAYER[prefix],
        ...CONFIG,
      }
    }
    return player =>
      // @ts-expect-error Trust me, TS
      generateOptionsProxy(PLAYER_DB, prefix, this.PLAYER[prefix], player)
  }

  /** @type {Record<string, WorldOptions>} */
  static WORLD = {}

  /**
   * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the
   * configuration object's properties in localStorage
   * @template {WorldOptions} Config
   * @param {string} prefix - The prefix for the database.
   * @param {Config} CONFIG - The default values for the options.
   * @returns {{ [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
   */
  static world(prefix, CONFIG) {
    if (!(prefix in this.WORLD)) {
      this.WORLD[prefix] = CONFIG
    } else {
      this.WORLD[prefix] = {
        ...this.WORLD[prefix],
        ...CONFIG,
      }
    }
    // @ts-expect-error Trust me, TS
    return generateOptionsProxy(WORLD_OPTIONS_DB, prefix, this.WORLD[prefix])
  }
}

/**
 * It creates a proxy object that allows you to access and modify the values of a given object, but the
 * values are stored in a database
 * @param {OPTIONS_DB} database - The prefix for the database.
 * @param {string} prefix - The prefix for the database.
 * @param {DefaultOptions} CONFIG - This is the default configuration object. It's an object with the keys being the
 * option names and the values being the default values.
 * @param {Player | null} [player] - The player object.
 * @returns {Record<string, any>} An object with getters and setters
 */
function generateOptionsProxy(database, prefix, CONFIG, player = null) {
  const OptionsProxy = {}
  for (const prop in CONFIG) {
    const key = player ? player.id + ':' + prop : prop
    Object.defineProperty(OptionsProxy, prop, {
      configurable: false,
      enumerable: true,
      get() {
        return database[prefix]?.[key] ?? CONFIG[prop].value
      },
      set(v) {
        const value = database[prefix] ?? {}
        value[key] = v
        database[prefix] = value
      },
    })
  }
  return OptionsProxy
}

export class EditableLocation {
  static OPTION_KEY = 'locations'
  valid = true
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
    let rawLocation = WORLD_OPTIONS_DB[EditableLocation.OPTION_KEY][id]
    Options.WORLD[EditableLocation.OPTION_KEY][id] = {
      desc: `Позиция ${id}`,
      name: id,
      value: fallback ? Vector.string(fallback) : '',
    }

    let location =
      typeof rawLocation === 'string'
        ? rawLocation.split(' ').map(Number)
        : void 0

    if (!rawLocation) {
      if (fallback === false) {
        console.warn(
          '§eSet location §f' + id + '§e used in\n' + util.error.stack.get()
        )
        this.valid = false
        return
      } else {
        location = [fallback.x, fallback.y, fallback.z]
      }
    }

    if (!location || location.length !== 3) {
      util.error(new TypeError('Invalid location'))
      console.error(util.inspect(rawLocation))
      this.valid = false
      return
    }

    this.x = location[0]
    this.y = location[1]
    this.z = location[2]
  }
}

Options.WORLD[EditableLocation.OPTION_KEY] = {}
