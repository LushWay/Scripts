import { Player } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { FormCallback } from 'lib/form/utils'
import { stringify } from 'lib/util'
import { createLogger } from 'lib/utils/logger'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { MemoryTable, Table, table } from './database/abstract'
import { t } from './text'
import stringifyError from './utils/error'

// TODO refactor(leaftail1880): Move all types under the Settings namespace
// TODO refactor(leaftail1880): Move everything into the lib/settings/ folder

type DropdownSetting = [value: string, displayText: string]

/** Any setting value type */
type SettingValue = string | boolean | number | DropdownSetting[]

export const SETTINGS_GROUP_NAME = Symbol('SettingGroupName')

interface ConfigMeta {
  [SETTINGS_GROUP_NAME]?: string
}

export type SettingsConfig<T extends SettingValue = SettingValue> = Record<
  string,
  { name: string; description?: string; value: T; onChange?: VoidFunction }
> &
  ConfigMeta

/** Сonverting true and false to boolean and string[] to string and string literal to plain string */
/* eslint-disable @typescript-eslint/naming-convention */
type toPlain<T extends SettingValue> = T extends true | false
  ? boolean
  : T extends string
    ? string
    : T extends DropdownSetting[]
      ? T[number][0]
      : T extends number
        ? number
        : T

export type SettingsConfigParsed<T extends SettingsConfig> = { -readonly [K in keyof T]: toPlain<T[K]['value']> }

export type SettingsDatabaseValue = Record<string, SettingValue>
export type SettingsDatabase = Table<SettingsDatabaseValue>

export type PlayerSettingValues = boolean | string | number | DropdownSetting[]

type WorldSettingsConfig = SettingsConfig & Record<string, { required?: boolean }>

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
   * @param groupName - The name that shows to players
   * @param groupId - The id for the database.
   * @param config - This is an object that contains the default values for each option.
   * @returns An function that returns object with properties that are getters and setters.
   */
  static player<const Config extends SettingsConfig<PlayerSettingValues>>(
    groupName: string,
    groupId: string,
    config: Config,
  ) {
    this.insertGroup('playerMap', groupName, groupId, config)

    const cache = new WeakPlayerMap()

    const fn = (player: Player): SettingsConfigParsed<Config> => {
      const cached = cache.get(player)
      if (cached) {
        return cached as SettingsConfigParsed<Config>
      } else {
        const settings = this.parseConfig(Settings.playerDatabase, groupId, this.playerMap[groupId] as Config, player)
        cache.set(player, settings)
        return settings
      }
    }

    fn.groupId = groupId
    fn.groupName = groupName
    fn.extend = [groupName, groupId] as const

    return fn
  }

  static worldDatabase = this.createDatabase('worldOptions')

  static worldMap: Record<string, WorldSettingsConfig> = {}

  /**
   * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the configuration
   * object's properties in localStorage
   *
   * @template Config
   * @param groupId - The id for the database.
   * @param config - The default values for the options.
   * @returns An object with properties that are getters and setters.
   */
  static world<const Config extends WorldSettingsConfig>(
    groupName: string,
    groupId: string,
    config: Config,
  ): SettingsConfigParsed<Config> {
    this.insertGroup('worldMap', groupName, groupId, config)
    return this.parseConfig(Settings.worldDatabase, groupId, this.worldMap[groupId] as Config)
  }

  static worldCommon = ['Общие настройки мира\n§7Чат, спавн и тд', 'common'] as const

  private static insertGroup(to: 'worldMap' | 'playerMap', groupName: string, groupId: string, config: SettingsConfig) {
    if (!(groupId in this[to])) {
      this[to][groupId] = config
    } else {
      this[to][groupId] = { ...config, ...this[to][groupId] }
    }

    this[to][groupId][SETTINGS_GROUP_NAME] = groupName
    this[to][groupId]
  }

  /**
   * It creates a proxy object that allows you to access and modify the values of a given object, but the values are
   * stored in a database
   *
   * @param database - The database.
   * @param groupId - The group id of the settings
   * @param config - This is the default configuration object. It's an object with the keys being the option names and
   *   the values being the default values.
   * @param player - The player object.
   * @returns An object with getters and setters
   */
  static parseConfig<Config extends SettingsConfig>(
    database: SettingsDatabase,
    groupId: string,
    config: Config,
    player: Player | null = null,
  ) {
    const settings = {}

    for (const prop in config) {
      const key = player ? `${player.id}:${prop}` : prop
      Object.defineProperty(settings, prop, {
        configurable: false,
        enumerable: true,
        get() {
          const value = config[prop]?.value
          if (typeof value === 'undefined') throw new TypeError(`No config value for prop ${prop}`)
          return (
            (database.getImmutable(groupId) as SettingsDatabaseValue | undefined)?.[key] ??
            (Settings.isDropdown(value) ? value[0]?.[0] : value)
          )
        },
        set(v: toPlain<SettingValue>) {
          let value = database.get(groupId)
          if (typeof value === 'undefined') {
            database.set(groupId, {})
            value = database.get(groupId)
          }
          value[key] = v
          config[prop]?.onChange?.()
          database.set(groupId, value)
        },
      })
    }

    return settings as SettingsConfigParsed<Config>
  }

  static isDropdown(v: SettingValue): v is DropdownSetting[] {
    return (
      Array.isArray(v) &&
      v.length > 0 &&
      v.every(e => Array.isArray(e) && typeof e[1] === 'string' && typeof e[0] === 'string')
    )
  }
}

export function settingsModal<const Config extends SettingsConfig<PlayerSettingValues>>(
  player: Player,
  config: Config,
  settingsStorage: SettingsConfigParsed<Config>,
  back: VoidFunction,
) {
  const propertyName = 'modal'
  settingsGroupMenu(
    player,
    propertyName,
    false,
    {},
    new MemoryTable<SettingsDatabaseValue>({ [propertyName]: settingsStorage }, () => ({})),
    { [propertyName]: config },
    back,
    false,
  )
}

const logger = createLogger('Settings')

// TODO ref(leatail1880): Clenup settingsGroupMenu parameters
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
  const displayType = forRegularPlayer ? 'own' : 'world'
  const config = configSource[groupName]
  if (!config) throw new TypeError(`No config for groupName ${groupName}`)

  const store = Settings.parseConfig(storeSource, groupName, config, forRegularPlayer ? player : null)
  const buttons: [string, (input: string | boolean) => string][] = []
  const form = new ModalForm<(ctx: FormCallback<ModalForm>, ...options: (string | boolean)[]) => void>(
    config[SETTINGS_GROUP_NAME] ?? groupName,
  )

  for (const key in config) {
    const saved = store[key] as string | number | boolean | undefined
    const setting = config[key]
    if (!setting) throw new TypeError(`No setting for key ${key}`)

    const value = saved ?? setting.value

    const isUnset = typeof saved === 'undefined'
    const isRequired = (Reflect.get(setting, 'requires') as boolean) && isUnset
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
      form.addDropdownFromObject(label, Object.fromEntries(setting.value), {
        defaultValueIndex: Settings.isDropdown(value) ? undefined : value,
      })
    } else {
      const isString = typeof value === 'string'

      if (!isString) {
        label += `\n§7§lЗначение:§r ${stringify(value)}`

        label += `\n§7§lТип: §r§f${settingTypes[typeof value] ?? typeof value}`
      }

      form.addTextField(label, 'Настройка не изменится', isString ? value : JSON.stringify(value))
    }

    buttons.push([
      key,
      input => {
        try {
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
                result = JSON.parse(input) as typeof result

                break
            }
          }

          if (stringify(store[key]) === stringify(result)) return ''
          if (typeof result !== 'undefined') {
            logger.player(player).info`Changed ${displayType} setting '${groupName} > ${key}' to '${result}'`
            store[key] = result
          }

          return showHintAboutSavedStatus ? '§aСохранено!' : ''
        } catch (error: unknown) {
          logger.player(player).info`Changing ${displayType} setting '${groupName} > ${key}' error: ${error}`

          return stringifyError.isError(error) ? `§c${error.message}` : stringify(error)
        }
      },
    ])
  }

  form.show(player, (_, ...settings) => {
    const hints: Record<string, string> = {}

    for (const [i, setting] of settings.entries()) {
      const button = buttons[i]
      if (!button) continue

      const [key, callback] = button
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
> = { string: 'Строка', number: 'Число', object: 'JSON-Объект', boolean: 'Переключатель' }

/** Opens player settings menu */
export function playerSettingsMenu(player: Player, back?: VoidFunction) {
  const form = new ActionForm('§dНастройки')
  if (back) form.addButtonBack(back)

  for (const groupName in Settings.playerMap) {
    const name = Settings.playerMap[groupName]?.[SETTINGS_GROUP_NAME]
    if (name) form.addButton(name, () => settingsGroupMenu(player, groupName, true))
  }

  form.show(player)
}

export function worldSettingsMenu(player: Player) {
  const form = new ActionForm('§dНастройки мира')

  for (const [groupId, group] of Object.entries(Settings.worldMap)) {
    const database = Settings.worldDatabase.get(groupId)

    let unsetCount = 0
    for (const [key, option] of Object.entries(group)) {
      if (option.required && typeof database[key] === 'undefined') unsetCount++
    }

    form.addButton(`${group[SETTINGS_GROUP_NAME] ?? groupId} ${t.error.badge`${unsetCount}`}`, () => {
      settingsGroupMenu(player, groupId, false)
    })
  }

  form.show(player)
}
