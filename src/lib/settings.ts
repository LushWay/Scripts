import { Player } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { FormCallback } from 'lib/form/utils'
import { util } from 'lib/util'
import { WeakPlayerMap } from 'lib/weak-player-map'
import { table } from './database/abstract'

type DropdownSetting = [value: string, displayText: string]

/** Any setting value type */
type SettingValue = string | boolean | number | DropdownSetting[]

export const SETTINGS_GROUP_NAME = Symbol('name')

interface GroupNameObject {
  [SETTINGS_GROUP_NAME]?: string
}

export type SettingsConfig<T extends SettingValue = SettingValue> = Record<
  string,
  {
    name: string
    description?: string
    value: T
    onChange?: VoidFunction
  }
> &
  GroupNameObject

/** Сonverting true and false to boolean and string[] to string and string literal to plain string */
/* eslint-disable @typescript-eslint/naming-convention */
type toPlain<T> = T extends true | false
  ? boolean
  : T extends string
    ? string
    : T extends DropdownSetting[]
      ? T[number][0]
      : T

export type SettingsConfigParsed<T extends SettingsConfig> = {
  [K in keyof T]: toPlain<T[K]['value']>
}

export type SettingsDatabaseValue = Record<string, SettingValue>
export type SettingsDatabase = Record<string, SettingsDatabaseValue>

export type PlayerSettingValues = boolean | string | number | DropdownSetting[]

type WorldSettingsConfig = SettingsConfig<SettingValue> & Record<string, { requires?: boolean }>

export class Settings {
  /** Creates typical settings database */
  private static createDatabase(name: string) {
    return table<SettingsDatabaseValue>(name, () => ({}))
  }

  static playerDatabase = this.createDatabase('playerOptions')

  static playerMap: Record<string, SettingsConfig<PlayerSettingValues>> = {}

  /**
   * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are stored in a
   * database
   *
   * @template Config
   * @param name - The name that shows to players
   * @param groupName - The prefix for the database.
   * @param config - This is an object that contains the default values for each option.
   * @returns An function that returns object with properties that are getters and setters.
   */
  static player<Config extends SettingsConfig<PlayerSettingValues>>(
    name: string,
    groupName: string,
    config: Narrow<Config> & GroupNameObject,
  ): (player: Player) => SettingsConfigParsed<Config> {
    config[SETTINGS_GROUP_NAME] = name

    this.insertGroup('playerMap', groupName, config as Config)

    const cache = new WeakPlayerMap({ removeOnLeave: true })

    return player => {
      const cached = cache.get(player)
      if (cached) {
        return cached as SettingsConfigParsed<Config>
      } else {
        const settings = this.parseConfig(
          Settings.playerDatabase,
          groupName,
          this.playerMap[groupName] as Config,
          player,
        )
        cache.set(player, settings)
        return settings
      }
    }
  }

  static worldDatabase = this.createDatabase('worldOptions')

  static worldMap: Record<string, WorldSettingsConfig> = {}

  /**
   * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the configuration
   * object's properties in localStorage
   *
   * @template Config
   * @param groupName - The prefix for the database.
   * @param config - The default values for the options.
   * @returns An object with properties that are getters and setters.
   */
  static world<Config extends WorldSettingsConfig>(
    groupName: string,
    config: Narrow<Config> & GroupNameObject,
  ): SettingsConfigParsed<Config> {
    this.insertGroup('worldMap', groupName, config as Config)
    return this.parseConfig(Settings.worldDatabase, groupName, this.worldMap[groupName] as Config)
  }

  private static insertGroup<Config extends SettingsConfig>(
    to: 'worldMap' | 'playerMap',
    groupName: string,
    config: Config,
  ) {
    if (!(groupName in this[to])) {
      this[to][groupName] = config
    } else {
      this[to][groupName] = {
        ...config,
        ...this[to][groupName],
      }
    }
  }

  /**
   * It creates a proxy object that allows you to access and modify the values of a given object, but the values are
   * stored in a database
   *
   * @param database - The prefix for the database.
   * @param groupName - The group name of the settings
   * @param config - This is the default configuration object. It's an object with the keys being the option names and
   *   the values being the default values.
   * @param player - The player object.
   * @returns An object with getters and setters
   */
  static parseConfig<T extends SettingsConfig>(
    database: SettingsDatabase,
    groupName: string,
    config: T,
    player: Player | null = null,
  ) {
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

    return settings as SettingsConfigParsed<T>
  }

  static isDropdown(v: SettingValue): v is DropdownSetting[] {
    return (
      Array.isArray(v) &&
      v.length > 0 &&
      v.every(e => Array.isArray(e) && typeof e[1] === 'string' && typeof e[0] === 'string')
    )
  }
}

export function settingsGroupMenu(
  player: Player,
  groupName: string,
  forRegularPlayer: boolean,
  hints: Record<string, string> = {},
  storeSource = forRegularPlayer ? Settings.playerDatabase : Settings.worldDatabase,
  configSource = forRegularPlayer ? Settings.playerMap : Settings.worldMap,
  back = forRegularPlayer ? playerSettingsMenu : worldSettingsMenu,
  showHintAboutSavedStatus = true,
) {
  const config = configSource[groupName]
  const store = Settings.parseConfig(storeSource, groupName, config, forRegularPlayer ? player : null)
  const buttons: [string, (input: string | boolean) => string][] = []
  const form = new ModalForm<(ctx: FormCallback<ModalForm>, ...options: (string | boolean)[]) => void>(
    config[SETTINGS_GROUP_NAME] ?? groupName,
  )

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

        label += `\n§7§lТип: §r§f${settingTypes[typeof value] ?? typeof value}`
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
    const hints: Record<string, string> = {}

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

const settingTypes: Partial<
  Record<'string' | 'number' | 'object' | 'boolean' | 'symbol' | 'bigint' | 'undefined' | 'function', string>
> = {
  string: 'Строка',
  number: 'Число',
  object: 'JSON-Объект',
  boolean: 'Переключатель',
}

/** Opens player settings menu */
export function playerSettingsMenu(player: Player, back?: VoidFunction) {
  const form = new ActionForm('§dНастройки')
  if (back) form.addButtonBack(back)

  for (const groupName in Settings.playerMap) {
    const name = Settings.playerMap[groupName][SETTINGS_GROUP_NAME]
    if (name) form.addButton(name, () => settingsGroupMenu(player, groupName, true))
  }

  form.show(player)
}

export function worldSettingsMenu(player: Player) {
  const form = new ActionForm('§dНастройки мира')

  for (const groupName in Settings.worldMap) {
    const database = Settings.worldDatabase[groupName]

    let unsetCount = 0
    for (const [key, option] of Object.entries(Settings.worldMap[groupName])) {
      if (option.requires && typeof database[key] === 'undefined') unsetCount++
    }

    form.addButton(util.badge(groupName, unsetCount, { color: '§c' }), () => {
      settingsGroupMenu(player, groupName, false)
    })
  }

  form.show(player)
}
