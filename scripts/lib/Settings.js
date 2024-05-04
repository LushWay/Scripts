import { Player } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { FormCallback } from 'lib/Form/utils.js'
import { WeakPlayerMap } from 'lib/WeakPlayerMap.js'
import { util } from 'lib/util.js'

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
 * }} SettingsConfigParsed
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
   * @returns {(player: Player) => SettingsConfigParsed<Config>} An function that returns object with properties that
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
        const settings = this.parseConfig(Settings.playerDatabase, groupName, this.playerMap[groupName], player)
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
   * @returns {SettingsConfigParsed<Config>} An object with properties that are getters and setters.
   */
  static world(groupName, config) {
    this.insertGroup(
      'worldMap',
      groupName,
      // @ts-expect-error Config narrowing
      config,
    )

    // @ts-expect-error Trust me, TS
    return this.parseConfig(Settings.worldDatabase, groupName, this.worldMap[groupName])
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
  static parseConfig(database, groupName, config, player = null) {
    const settings = {}

    for (const prop in config) {
      const key = player ? `${player.id}:${prop}` : prop
      Object.defineProperty(settings, prop, {
        configurable: false,
        enumerable: true,
        get() {
          const value = config[prop].value
          return database[groupName]?.[key] ?? (Settings.isDropdown(value) ? value[0][0] : value)
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
  static isDropdown(v) {
    return (
      Array.isArray(v) &&
      v.length > 0 &&
      v.every(e => Array.isArray(e) && typeof e[1] === 'string' && typeof e[0] === 'string')
    )
  }
}

/**
 * @param {Player} player
 * @param {string} groupName
 * @param {boolean} forRegularPlayer
 * @param {Record<string, string>} [hints]
 */

export function settingsGroupMenu(
  player,
  groupName,
  forRegularPlayer,
  hints = {},
  storeSource = forRegularPlayer ? Settings.playerDatabase : Settings.worldDatabase,
  configSource = forRegularPlayer ? Settings.playerMap : Settings.worldMap,
  back = forRegularPlayer ? playerSettingsMenu : worldSettingsMenu,
  showHintAboutSavedStatus = true,
) {
  const config = configSource[groupName]
  const store = Settings.parseConfig(storeSource, groupName, config, forRegularPlayer ? player : null)

  /** @type {[string, (input: string | boolean) => string][]} */
  const buttons = []

  /** @type {ModalForm<(ctx: FormCallback<ModalForm>, ...options: any) => void>} */
  const form = new ModalForm(config[SETTINGS_GROUP_NAME] ?? groupName)

  for (const key in config) {
    const saved = store[key]
    const setting = config[key]
    const value = saved ?? setting.value

    const isUnset = typeof saved === 'undefined'
    const isRequired = Reflect.get(config[key], 'requires') && isUnset

    const isToggle = typeof value === 'boolean'

    let label = ''
    label += hints[key] ? `${hints[key]}\n` : ''

    if (isRequired) label += '§c(!) '
    label += `§f§l${setting.name}§r§f` //§r

    if (setting.description) label += `§i - ${setting.description}`
    if (isUnset) label += `§8(По умолчанию)\n`

    if (isToggle) {
      form.addToggle(label, value)
    } else if (Settings.isDropdown(setting.value)) {
      form.addDropdownFromObject(label, Object.fromEntries(setting.value), { defaultValueIndex: value })
    } else {
      const isString = typeof value === 'string'

      if (!isString) {
        label += `\n§7§lЗначение:§r ${util.stringify(value)}`
        label += `\n§7§lТип: §r§f${Types[typeof value] ?? typeof value}`
      }

      form.addTextField(label, 'Настройка не изменится', isString ? value : JSON.stringify(value))
    }

    buttons.push([
      key,
      input => {
        if (typeof input === 'undefined' || input === '') return ''

        let result
        if (typeof input === 'boolean' || Settings.isDropdown(setting.value)) {
          result = input
        } else {
          switch (typeof setting.value) {
            case 'string':
              result = input
              break
            case 'number':
              result = Number(input)
              if (isNaN(result)) return '§cВведите число!'
              break
            case 'object':
              try {
                result = JSON.parse(input)
              } catch (error) {
                return `§c${error.message}`
              }
              break
          }
        }

        if (util.stringify(store[key]) === util.stringify(result)) return ''

        store[key] = result
        return showHintAboutSavedStatus ? '§aСохранено!' : ''
      },
    ])
  }

  form.show(player, (_, ...settings) => {
    /** @type {Record<string, string>} */
    const hints = {}

    for (const [i, setting] of settings.entries()) {
      const [key, callback] = buttons[i]
      const hint = callback(setting)
      if (hint) hints[key] = hint
    }

    if (Object.keys(hints).length) {
      // Show current menu with hints
      self()
    } else {
      // No hints, go back to previous menu
      back(player)
    }

    function self() {
      settingsGroupMenu(player, groupName, forRegularPlayer, hints, storeSource, configSource, back)
    }
  })
}

/** @typedef {'string' | 'number' | 'object' | 'boolean' | 'symbol' | 'bigint' | 'undefined' | 'function'} AllTypes */

/** @type {Partial<Record<AllTypes, string>>} */
const Types = {
  string: 'Строка',
  number: 'Число',
  object: 'JSON-Объект',
  boolean: 'Переключатель',
}

/**
 * Opens player settings menu
 *
 * @param {Player} player
 * @param {VoidFunction} [back]
 */
export function playerSettingsMenu(player, back) {
  const form = new ActionForm('§dНастройки')
  if (back) form.addButtonBack(back)

  for (const groupName in Settings.playerMap) {
    const name = Settings.playerMap[groupName][SETTINGS_GROUP_NAME]
    if (name) form.addButton(name, () => settingsGroupMenu(player, groupName, true))
  }

  form.show(player)
}

/** @param {Player} player */
export function worldSettingsMenu(player) {
  const form = new ActionForm('§dНастройки мира')

  for (const groupName in Settings.worldMap) {
    const db = Settings.worldDatabase[groupName]

    let requiresCount = 0
    for (const [key, option] of Object.entries(Settings.worldMap[groupName])) {
      const requiredButNotDefined = option.requires && typeof db[key] === 'undefined'
      if (requiredButNotDefined) requiresCount++
    }

    form.addButton(`${groupName}${requiresCount ? ` §c(${requiresCount}!)` : ''}`, null, () => {
      settingsGroupMenu(player, groupName, false)
    })
  }

  form.show(player)
}
