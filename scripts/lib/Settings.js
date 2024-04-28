import { Player } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { WeakPlayerMap } from 'lib/WeakPlayerMap.js'

/** @typedef {[value: string, displayText: string]} DropdownSetting */

/**
 * Any setting value type
 *
 * @typedef {string | boolean | number | DropdownSetting[]} SettingValue
 */

export const SETTINGS_GROUP_NAME = Symbol('name')

/** @typedef {{ [SETTINGS_GROUP_NAME]?: string }} GroupNameObject */

/**
 * @template {SettingValue} [T=SettingValue] Default is `SettingValue`
 * @typedef {Record<
 *   string,
 *   {
 *     name: string
 *     description?: string
 *     value: T
 *     onChange?: VoidFunction
 *   }
 * > &
 *   GroupNameObject} SettingsConfig
 */

/**
 * Сonverting true and false to boolean and string[] to string and string literal to plain string
 *
 * @template T
 * @typedef {T extends true | false
 *   ? boolean
 *   : T extends string
 *     ? string
 *     : T extends DropdownSetting[]
 *       ? T[number][0]
 *       : T} toPlain
 */

/**
 * @template {SettingsConfig} T
 * @typedef {{
 *   [K in keyof T]: toPlain<T[K]['value']>
 * }} ParsedSettingsConfig
 */

/** @typedef {Record<string, Record<string, SettingValue>>} SettingsDatabase */

/** @typedef {boolean | string | number | DropdownSetting[]} PlayerSettingValues */

export class Settings {
  /**
   * Creates typical settings database
   *
   * @private
   * @param {string} name
   */
  static createDatabase(name) {
    const db = new DynamicPropertyDB(name, {
      /** @type {SettingsDatabase} */
      type: {},
      defaultValue: () => {
        return {}
      },
    })

    return db.proxy()
  }

  static playerDatabase = this.createDatabase('playerOptions')

  /** @type {Record<string, SettingsConfig<PlayerSettingValues>>} */
  static playerMap = {}

  /**
   * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are stored in a
   * database
   *
   * @template {SettingsConfig<PlayerSettingValues>} Config
   * @param {string} name - The name that shows to players
   * @param {string} groupName - The prefix for the database.
   * @param {Narrow<Config> & GroupNameObject} config - This is an object that contains the default values for each
   *   option.
   * @returns {(player: Player) => ParsedSettingsConfig<Config>} An function that returns object with properties that
   *   are getters and setters.
   */
  static player(name, groupName, config) {
    config[SETTINGS_GROUP_NAME] = name

    this.insertGroup(
      'playerMap',
      groupName,
      // @ts-expect-error Config narrowing
      config,
    )

    const cache = new WeakPlayerMap({ removeOnLeave: true })

    return player => {
      const cached = cache.get(player)
      if (cached) {
        return cached
      } else {
        const settings = createSettingsObject(Settings.playerDatabase, groupName, this.playerMap[groupName], player)
        cache.set(player, settings)
        return settings
      }
    }
  }

  static worldDatabase = this.createDatabase('worldOptions')

  /** @typedef {SettingsConfig<SettingValue> & Record<string, { requires?: boolean }>} WorldSettingsConfig */

  /** @type {Record<string, WorldSettingsConfig>} */
  static worldMap = {}

  /**
   * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the configuration
   * object's properties in localStorage
   *
   * @template {WorldSettingsConfig} Config
   * @param {string} groupName - The prefix for the database.
   * @param {Narrow<Config> & GroupNameObject} config - The default values for the options.
   * @returns {ParsedSettingsConfig<Config>} An object with properties that are getters and setters.
   */
  static world(groupName, config) {
    this.insertGroup(
      'worldMap',
      groupName,
      // @ts-expect-error Config narrowing
      config,
    )

    // @ts-expect-error Trust me, TS
    return createSettingsObject(Settings.worldDatabase, groupName, this.worldMap[groupName])
  }

  /**
   * @private
   * @template {SettingsConfig} Config
   * @param {'worldMap' | 'playerMap'} to
   * @param {string} groupName
   * @param {Config} config
   */
  static insertGroup(to, groupName, config) {
    if (!(groupName in this[to])) {
      this[to][groupName] = config
    } else {
      this[to][groupName] = {
        ...this[to][groupName],
        ...config,
      }
    }
  }
}

/**
 * It creates a proxy object that allows you to access and modify the values of a given object, but the values are
 * stored in a database
 *
 * @param {SettingsDatabase} database - The prefix for the database.
 * @param {string} groupName - The group name of the settings
 * @param {SettingsConfig} config - This is the default configuration object. It's an object with the keys being the
 *   option names and the values being the default values.
 * @param {Player | null} [player] - The player object.
 * @returns {Record<string, any>} An object with getters and setters
 */
export function createSettingsObject(database, groupName, config, player = null) {
  const settings = {}

  for (const prop in config) {
    const key = player ? `${player.id}:${prop}` : prop
    Object.defineProperty(settings, prop, {
      configurable: false,
      enumerable: true,
      get() {
        const value = config[prop].value
        return database[groupName]?.[key] ?? (isDropdown(value) ? value[0][0] : value)
      },
      set(v) {
        const value = (database[groupName] ??= {})
        value[key] = v
        config[prop].onChange?.()
        database[groupName] = value
      },
    })
  }

  return settings
}

/**
 * @param {SettingValue} v
 * @returns {v is DropdownSetting[]}
 */
export function isDropdown(v) {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(e => Array.isArray(e) && typeof e[1] === 'string' && typeof e[0] === 'string')
  )
}
