import { Player, Vector } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { util } from '../util.js'

export const OPTIONS_NAME = Symbol('name')

/**
 * Сonverting true and false to boolean
 * @template T
 * @typedef {T extends true | false ? boolean : T} Normalize
 */

/**
 * @typedef {string | boolean | number | JSONLike} SettingValue
 */

/**
 * @template [T = boolean | string | number | JSONLike]
 * @typedef {Record<string, { desc: string; value: T, name: string }> & {[OPTIONS_NAME]?: string}} DefaultSettings
 */

/** @typedef {Record<string, Record<string, SettingValue>>} SETTINGS_DB */

export const PLAYER_SETTINGS_DB = new DynamicPropertyDB('playerOptions', {
  /** @type {SETTINGS_DB} */
  type: {},
  defaultValue: () => {
    return {}
  },
}).proxy()

/** @typedef {DefaultSettings<SettingValue> & Record<string, { requires?: boolean }>} WorldSettings */
export const WORLD_SETTINGS_DB = new DynamicPropertyDB('worldOptions', {
  /** @type {SETTINGS_DB} */
  type: {},
  defaultValue: () => {
    return {}
  },
}).proxy()

export class Settings {
  /** @type {Record<string, DefaultSettings<boolean>>} */
  static playerMap = {}
  /**
   * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are
   * stored in a database
   * @template {DefaultSettings<boolean>} Config
   * @param {string} name - The name that shows to players
   * @param {string} prefix - The prefix for the database.
   * @param {Config} config - This is an object that contains the default values for each option.
   * @returns {(player: Player) => { [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
   */
  static player(name, prefix, config) {
    config[OPTIONS_NAME] = name

    if (!(prefix in this.playerMap)) {
      this.playerMap[prefix] = config
    } else {
      this.playerMap[prefix] = {
        ...this.playerMap[prefix],
        ...config,
      }
    }
    return player =>
      // @ts-expect-error Trust me, TS
      generateSettingsProxy(
        PLAYER_SETTINGS_DB,
        prefix,
        this.playerMap[prefix],
        player
      )
  }

  /** @type {Record<string, WorldSettings>} */
  static worldMap = {}

  /**
   * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the
   * configuration object's properties in localStorage
   * @template {WorldSettings} Config
   * @param {string} prefix - The prefix for the database.
   * @param {Config} config - The default values for the options.
   * @returns {{ [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
   */
  static world(prefix, config) {
    if (!(prefix in this.worldMap)) {
      this.worldMap[prefix] = config
    } else {
      this.worldMap[prefix] = {
        ...this.worldMap[prefix],
        ...config,
      }
    }
    // @ts-expect-error Trust me, TS
    return generateSettingsProxy(
      WORLD_SETTINGS_DB,
      prefix,
      this.worldMap[prefix]
    )
  }
}

/**
 * It creates a proxy object that allows you to access and modify the values of a given object, but the
 * values are stored in a database
 * @param {SETTINGS_DB} database - The prefix for the database.
 * @param {string} prefix - The prefix for the database.
 * @param {DefaultSettings} config - This is the default configuration object. It's an object with the keys being the
 * option names and the values being the default values.
 * @param {Player | null} [player] - The player object.
 * @returns {Record<string, any>} An object with getters and setters
 */
function generateSettingsProxy(database, prefix, config, player = null) {
  const OptionsProxy = {}
  for (const prop in config) {
    const key = player ? player.id + ':' + prop : prop
    Object.defineProperty(OptionsProxy, prop, {
      configurable: false,
      enumerable: true,
      get() {
        return database[prefix]?.[key] ?? config[prop].value
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
  static key = 'locations'
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
    const raw = WORLD_SETTINGS_DB[EditableLocation.key][id]
    Settings.worldMap[EditableLocation.key][id] = {
      desc: `Позиция ${id}`,
      name: id,
      value: fallback ? Vector.string(fallback) : '',
    }

    if (typeof raw !== 'string' || raw === '') {
      if (fallback === false) {
        console.warn(
          '§eEmpty location §f' + id + '\n§r' + util.error.stack.get(1)
        )
        this.valid = false
        return
      } else {
        this.x = fallback.x
        this.y = fallback.y
        this.z = fallback.z
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
  }
}

Settings.worldMap[EditableLocation.key] = {}
