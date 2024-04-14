import { Player } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

/**
 * @typedef {[value: string, displayText: string]} DropdownSetting
 */

/**
 * Any setting value type
 * @typedef {string | boolean | number | DropdownSetting[]} SettingValue
 */

export const SETTINGS_GROUP_NAME = Symbol('name')

/**
 * @typedef {{ [SETTINGS_GROUP_NAME]?: string }} GroupName
 */

/**
 * @template {SettingValue} [T = SettingValue]
 * @typedef {Record<string,
 *   {
 *     name: string,
 *     description?: string;
 *     value: T,
 *     onChange?: VoidFunction
 *   }
 * > & GroupName
 * } SettingsConfig
 */

/**
 * Сonverting true and false to boolean and string[] to string
 * @template T
 * @typedef {T extends true | false ? boolean : T extends string ? string : T extends DropdownSetting[] ? T[number][0] : T } PlainSetting
 */

/**
 * @template {SettingsConfig} Config
 * @typedef {{
 *  [Prop in keyof Config]: PlainSetting<Config[Prop]["value"]>;
 * }} ParsedSettingsConfig
 */

/**
 * @typedef {Record<string, Record<string, SettingValue>>} SettingsDatabase
 */

export const PLAYER_SETTINGS_DB = new DynamicPropertyDB('playerOptions', {
  /** @type {SettingsDatabase} */
  type: {},
  defaultValue: () => {
    return {}
  },
}).proxy()

/** @typedef {SettingsConfig<SettingValue> & Record<string, { requires?: boolean, }>} WorldSettings */
export const WORLD_SETTINGS_DB = new DynamicPropertyDB('worldOptions', {
  /** @type {SettingsDatabase} */
  type: {},
  defaultValue: () => {
    return {}
  },
}).proxy()

export class Settings {
  /**
   * @typedef {boolean | string | DropdownSetting[]} PlayerSettingTypes
   */

  /**
   * @type {Record<string, SettingsConfig<PlayerSettingTypes>>}
   */
  static playerMap = {}
  /**
   * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are
   * stored in a database
   * @param {string} name - The name that shows to players
   * @param {string} groupName - The prefix for the database.
   * @template {SettingsConfig<PlayerSettingTypes>} Config
   * @param {Narrow<Config> & GroupName} config - This is an object that contains the default values for each option.
   * @returns {(player: Player) => ParsedSettingsConfig<Config>} An object with properties that are getters and setters.
   */
  static player(name, groupName, config) {
    config[SETTINGS_GROUP_NAME] = name

    this.insertGroup(
      'playerMap',
      groupName,
      // @ts-expect-error Config narrowing
      config
    )

    return player =>
      // @ts-expect-error Trust me, TS
      createSettingsObject(PLAYER_SETTINGS_DB, groupName, this.playerMap[groupName], player)
  }

  /**
   * @type {Record<string, WorldSettings>}
   */
  static worldMap = {}

  /**
   * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the
   * configuration object's properties in localStorage
   * @template {WorldSettings} Config
   * @param {string} groupName - The prefix for the database.
   * @param {Narrow<Config> & GroupName} config - The default values for the options.
   * @returns {ParsedSettingsConfig<Config>} An object with properties that are getters and setters.
   */
  static world(groupName, config) {
    this.insertGroup(
      'worldMap',
      groupName,
      // @ts-expect-error Config narrowing
      config
    )

    // @ts-expect-error Trust me, TS
    return createSettingsObject(WORLD_SETTINGS_DB, groupName, this.worldMap[groupName])
  }

  /**
   * @template {SettingsConfig} Config
   *
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
 * It creates a proxy object that allows you to access and modify the values of a given object, but the
 * values are stored in a database
 * @param {SettingsDatabase} database - The prefix for the database.
 * @param {string} groupName - The group name of the settings
 * @param {SettingsConfig} config - This is the default configuration object. It's an object with the keys being the
 * option names and the values being the default values.
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
 * @param {import('lib.js').SettingValue} v
 * @returns {v is DropdownSetting[]}
 */
export function isDropdown(v) {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(e => Array.isArray(e) && typeof e[1] === 'string' && typeof e[0] === 'string')
  )
}
