import { Player } from '@minecraft/server'
import { FormCallback, util } from 'lib.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { isDropdown } from 'lib/Settings'
import { SETTINGS_GROUP_NAME, Settings, createSettingsObject } from 'lib/Settings.js'

/**
 * @typedef {"string"
 * 	| "number"
 * 	| "object"
 * 	| "boolean"
 * 	| "symbol"
 * 	| "bigint"
 * 	| "undefined"
 * 	| "function"} AllTypes
 */

/** @type {Partial<Record<AllTypes, string>>} */
const Types = {
  string: 'Строка',
  number: 'Число',
  object: 'JSON-Объект',
  boolean: 'Переключатель',
}

new Command({
  name: 'settings',
  aliases: ['options', 's'],
  role: 'member',
  description: 'Настройки',
}).executes(ctx => {
  playerSettingsMenu(ctx.sender)
})

/**
 * Opens player settings menu
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

new Command({
  name: 'wsettings',
  role: 'techAdmin',
  description: 'Настройки мира',
}).executes(ctx => {
  worldSettingsMenu(ctx.sender)
})

/**
 * @param {Player} player
 */
function worldSettingsMenu(player) {
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

/**
 *
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
  showSavedHint = true
) {
  const config = configSource[groupName]
  const store = createSettingsObject(storeSource, groupName, config, forRegularPlayer ? player : null)

  /**
   * @type {[string, (input: string | boolean) => string][]}
   */
  const buttons = []

  /**
   * @type {ModalForm<(ctx: FormCallback<ModalForm>, ...options: any) => void>}
   */
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
    } else if (isDropdown(setting.value)) {
      form.addDropdownFromObject(label, Object.fromEntries(setting.value), { defaultValue: value })
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
        if (typeof input === 'boolean' || isDropdown(setting.value)) {
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
        return showSavedHint ? '§aСохранено!' : ''
      },
    ])
  }

  form.show(player, (_, ...settings) => {
    /**
     * @type {Record<string, string>}
     */
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
