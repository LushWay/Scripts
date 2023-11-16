import { Player, world } from '@minecraft/server'
import { OPTIONS_NAME, Settings, WORLD_SETTINGS_DB } from 'lib/Class/Options.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { FormCallback, PLAYER_DB, ROLES, getRole, setRole, util } from 'xapi.js'

const NAME = new XCommand({
  name: 'name',
  description: 'Меняет имя',
  role: 'admin',
})

NAME.literal({ name: 'set' })
  .string('new name')
  .executes((ctx, newname) => {
    ctx.sender.nameTag = newname
  })

NAME.literal({ name: 'reset' }).executes(ctx => {
  for (const player of world.getPlayers()) player.nameTag = player.name
})

const R = new XCommand({
  name: 'role',
  description: 'Показывает вашу роль',
})

R.executes(ctx => {
  const role = getRole(ctx.sender.id)
  const noAdmins = !Object.values(PLAYER_DB)
    .map(e => e.role)
    .includes('admin')
  const isAdmin = role === 'admin'
  const needAdmin = ctx.args[0] === 'ACCESS'
  const beenAdmin = PLAYER_DB[ctx.sender.id].roleSetter && !isAdmin

  if (noAdmins && ctx.sender.isOp() && (needAdmin || beenAdmin)) {
    PLAYER_DB[ctx.sender.id].role = 'admin'
    delete PLAYER_DB[ctx.sender.id].roleSetter
    return ctx.reply('§b> §3Вы получили роль §r' + ROLES.admin)
  }

  if (!isAdmin) return ctx.reply(`§b> §r${ROLES[role]}`)

  /**
   *
   * @param {Player} player
   * @returns
   */
  const callback = (player, fakeChange = false) => {
    return () => {
      const role = getRole(player.id)
      const ROLE = Object.fromEntries(
        Object.entriesStringKeys(ROLES).map(([key]) => [
          key,
          `${role === key ? '> ' : ''}${ROLES[key]}`,
        ]),
      )
      new ModalForm(player.name)
        .addToggle('Уведомлять', false)
        .addToggle('Показать Ваш ник в уведомлении', false)
        .addDropdownFromObject('Роль', ROLE)
        .addTextField('Причина смены роли', `Например, "космокс"`)
        .show(ctx.sender, (formCtx, notify, showName, newrole, message) => {
          if (newrole.startsWith('>')) return
          if (!newrole)
            return formCtx.error(
              'Неизвестная роль: ' +
                newrole +
                '§r, допустимые: ' +
                util.inspect(ROLES),
            )
          if (notify)
            player.tell(
              `§b> §3Ваша роль сменена c ${ROLES[role]} §3на ${newrole}${
                showName ? `§3 игроком §r${ctx.sender.name}` : ''
              }${message ? `\n§r§3Причина: §r${message}` : ''}`,
            )
          setRole(player.id, newrole)
          if (fakeChange) {
            PLAYER_DB[player.id].role = newrole
            PLAYER_DB[player.id].roleSetter = 1
          }
        })
    }
  }
  const form = new ActionForm('Roles', '§3Ваша роль: ' + ROLES[role]).addButton(
    'Сменить мою роль',
    null,
    callback(ctx.sender, true),
  )

  for (const player of world.getPlayers({ excludeNames: [ctx.sender.name] }))
    form.addButton(player.name, null, callback(player))

  form.show(ctx.sender)
})

new XCommand({
  name: 'options',
  aliases: ['settings', 's'],
  role: 'member',
  description: 'Настройки',
}).executes(ctx => {
  poptions(ctx.sender)
})

/**
 * @param {Player} player
 */
function poptions(player) {
  const form = new ActionForm('§dНастройки')

  for (const groupName in Settings.playerMap) {
    const name = Settings.playerMap[groupName][OPTIONS_NAME]
    if (name)
      form.addButton(name, null, () => {
        optionsGroup(player, groupName, 'PLAYER')
      })
  }

  form.show(player)
}

new XCommand({
  name: 'wsettings',
  role: 'admin',
  description: 'Настройки мира',
}).executes(ctx => {
  options(ctx.sender)
})

/**
 * @param {Player} player
 */
function options(player) {
  const form = new ActionForm('§dНастройки мира')

  for (const groupName in Settings.worldMap) {
    const data = WORLD_SETTINGS_DB[groupName]
    const requires = Object.entries(Settings.worldMap[groupName]).reduce(
      (count, [key, option]) =>
        option.requires && typeof data[key] === 'undefined' ? count + 1 : count,
      0,
    )
    form.addButton(
      `${groupName}${requires ? ` §c(${requires}!)` : ''}`,
      null,
      () => {
        optionsGroup(player, groupName, 'WORLD')
      },
    )
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
export function optionsGroup(player, groupName, groupType, errors = {}) {
  const source = groupType === 'PLAYER' ? Settings.playerMap : Settings.worldMap
  const config = source[groupName]
  const name = config[OPTIONS_NAME]
  const data = WORLD_SETTINGS_DB[groupName]

  /** @type {[string, (input: string | boolean) => string][]} */
  const buttons = []
  /** @type {ModalForm<(ctx: FormCallback<ModalForm>, ...options: any) => void>} */
  const form = new ModalForm(name ?? groupName)

  for (const KEY in config) {
    const OPTION = config[KEY]
    const dbValue = data[KEY]
    const isDef = typeof dbValue === 'undefined'
    const message = errors[KEY] ? `${errors[KEY]}\n` : ''
    const requires =
      Reflect.get(config[KEY], 'requires') && typeof dbValue === 'undefined'

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
    else
      form.addTextField(
        label,
        'Настройка не изменится',
        typeof value === 'string' ? value : JSON.stringify(value),
      )

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
          if (util.stringify(OPTION.value) === resultStr) return ''
          if (util.stringify(data[KEY]) === resultStr) return ''
          data[KEY] = result
          WORLD_SETTINGS_DB[groupName] = data
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

    if (Object.keys(messages).length)
      optionsGroup(player, groupName, groupType, messages)
    else {
      if (groupType === 'PLAYER') poptions(player)
      else options(player)
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
