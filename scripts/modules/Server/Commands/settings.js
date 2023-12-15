import { Player } from '@minecraft/server'
import {
  OPTIONS_NAME,
  PLAYER_SETTINGS_DB,
  Settings,
  WORLD_SETTINGS_DB,
  generateSettingsProxy,
} from 'lib/Class/Settings.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { FormCallback, util } from 'smapi.js'

new Command({
  name: 'wsettings',
  role: 'admin',
  description: 'Настройки мира',
}).executes(ctx => {
  worldSettings(ctx.sender)
})

/**
 * @param {Player} player
 */
function worldSettings(player) {
  const form = new ActionForm('§dНастройки мира')

  for (const groupName in Settings.worldMap) {
    const data = WORLD_SETTINGS_DB[groupName]
    const requires = Object.entries(Settings.worldMap[groupName]).reduce(
      (count, [key, option]) => (option.requires && typeof data[key] === 'undefined' ? count + 1 : count),
      0
    )
    form.addButton(`${groupName}${requires ? ` §c(${requires}!)` : ''}`, null, () => {
      settingsGroup(player, groupName, 'WORLD')
    })
  }

  form.show(player)
}

/**
 *
 * @param {Player} player
 * @param {string} groupName
 * @param {"PLAYER" | "WORLD"} groupType
 * @param {Record<string, string>} [errors]
 */
export function settingsGroup(player, groupName, groupType, errors = {}) {
  const groups = groupType === 'PLAYER' ? Settings.playerMap : Settings.worldMap
  const config = groups[groupName]
  const db = generateSettingsProxy(
    groupType === 'PLAYER' ? PLAYER_SETTINGS_DB : WORLD_SETTINGS_DB,
    groupName,
    config,
    groupType === 'PLAYER' ? player : null
  )

  /** @type {[string, (input: string | boolean) => string][]} */
  const buttons = []
  /** @type {ModalForm<(ctx: FormCallback<ModalForm>, ...options: any) => void>} */
  const form = new ModalForm(config[OPTIONS_NAME] ?? groupName)

  for (const KEY in config) {
    const OPTION = config[KEY]
    const dbValue = db[KEY]
    const isDef = typeof dbValue === 'undefined'
    const message = errors[KEY] ? `${errors[KEY]}\n` : ''
    const requires = Reflect.get(config[KEY], 'requires') && typeof dbValue === 'undefined'

    const value = dbValue ?? OPTION.value
    const toggle = typeof value === 'boolean'

    let label = toggle ? '' : '\n'
    label += message
    if (requires) label += '§c(!) '
    label += `§f${OPTION.name}` //§r
    if (OPTION.desc) label += `§i - ${OPTION.desc}`

    if (toggle) {
      if (isDef) label += `\n §8(По умолчанию)`
      label += '\n '
    } else {
      label += `\n   §7Значение: ${util.stringify(dbValue ?? OPTION.value)}`
      label += `${isDef ? ` §8(По умолчанию)` : ''}\n`

      label += `   §7Тип: §f${Types[typeof value] ?? typeof value}`
    }

    if (toggle) form.addToggle(label, value)
    else form.addTextField(label, 'Настройка не изменится', typeof value === 'string' ? value : JSON.stringify(value))

    buttons.push([
      KEY,
      input => {
        let result
        if (typeof input !== 'undefined' && input !== '') {
          if (typeof input === 'boolean') result = input
          else
            switch (typeof OPTION.value) {
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

          const resultStr = util.stringify(result)
          if (util.stringify(db[KEY]) === resultStr) return ''
          db[KEY] = result
          return '§aСохранено!'
        } else return ''
      },
    ])
  }

  form.show(player, (ctx, ...opts) => {
    /** @type {Record<string, string>} */
    const messages = {}
    for (const [i, option] of opts.entries()) {
      const [KEY, callback] = buttons[i]
      const result = callback(option)
      if (result) messages[KEY] = result
    }

    if (Object.keys(messages).length) settingsGroup(player, groupName, groupType, messages)
    else {
      if (groupType === 'PLAYER') playerSettings(player)
      else worldSettings(player)
    }
  })
}

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
  name: 'options',
  aliases: ['settings', 's'],
  role: 'member',
  description: 'Настройки',
}).executes(ctx => {
  playerSettings(ctx.sender)
})
/**
 * @param {Player} player
 */
export function playerSettings(player) {
  const form = new ActionForm('§dНастройки')

  for (const groupName in Settings.playerMap) {
    const name = Settings.playerMap[groupName][OPTIONS_NAME]
    if (name)
      form.addButton(name, null, () => {
        settingsGroup(player, groupName, 'PLAYER')
      })
  }

  form.show(player)
}
