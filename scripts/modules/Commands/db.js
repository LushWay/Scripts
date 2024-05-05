import { Player, system, world } from '@minecraft/server'
import { PLAYER_DB, ROLES, getRole, util } from 'lib.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { stringifyBenchmarkResult } from './stringifyBenchmarkReult'

const db = new Command('db').setDescription('Просматривает базу данных').setPermissions('techAdmin')

db.executes(ctx => selectTable(ctx.player, true))

/**
 * @param {Player} player
 * @param {true} [firstCall]
 */
function selectTable(player, firstCall) {
  const form = new ActionForm('Таблицы данных')
  for (const key in DynamicPropertyDB.tables) {
    const DB = DynamicPropertyDB.tables[key]
    const name = `${key} §7${Object.keys(DB.proxy()).length}§r`
    form.addButton(name, () => showTable(player, key))
  }
  form.show(player)
  if (firstCall) player.info('Закрой чат!')
}

/**
 * @param {Player} player
 * @param {string} table
 */
function showTable(player, table) {
  /** @type {DynamicPropertyDB<string, any>} */
  const DB = DynamicPropertyDB.tables[table]
  const proxy = DB.proxy()

  const menu = new ActionForm(`${table}`)
  menu.addButton(ActionForm.backText, () => selectTable(player))
  menu.addButton('§3Новое значение§r', () => {
    const form = new ModalForm('§3+Значение в §f' + table).addTextField('Ключ', ' ')
    const { newform, callback } = changeValue(form, null)
    newform.show(player, (_, key, input, type) => {
      if (input)
        callback(input, type, newVal => {
          proxy[key] = newVal
        })
      showTable(player, table)
    })
  })
  menu.addButton('§3Посмотреть в §fRAW', () => {
    let raw = world.getDynamicProperty(DB.tableId)
    try {
      if (typeof raw === 'string') raw = JSON.parse(raw)
    } catch {}

    new ActionForm('§3RAW table §f' + table, util.inspect(raw))
      .addButton('Oк', () => {
        showTable(player, table)
      })
      .show(player)
  })

  /** @param {string} key */
  const propertyForm = key => {
    key = key + ''
    /** @type {any} */
    let value
    let failedToLoad = false

    try {
      value = proxy[key]
    } catch (e) {
      util.error(e)
      value = 'a'
      failedToLoad = true
    }

    const AForm = new ActionForm(
      '§3Ключ ' + key,
      `§7Тип: §f${typeof value}\n ${
        failedToLoad ? '\n§cОшибка при получении данных из таблицы!§r\n\n' : ''
      }\n${util.inspect(value)}\n `,
    )

    AForm.addButton('Изменить', null, () => {
      const { newform, callback: ncallback } = changeValue(new ModalForm(key), value)

      newform.show(player, (_, input, inputType) => {
        if (input)
          ncallback(input, inputType, newValue => {
            proxy[key] = newValue
            player.tell(util.inspect(value) + '§r -> ' + util.inspect(newValue))
          })

        propertyForm(key)
      })
    })

    AForm.addButton('§cУдалить§r', () => {
      delete proxy[key]
      system.delay(() => {
        showTable(player, table)
      })
    })
    AForm.addButton(ActionForm.backText, () => showTable(player, table))

    AForm.show(player)
  }

  const keys = Object.keys(proxy)
  for (const key of keys) {
    let name = key
    if (table === 'player') {
      /** @type {typeof PLAYER_DB} */
      const p = proxy
      name = `${p[key].name} ${ROLES[getRole(key)] ?? '§7Без роли'}\n§8(${key})`
    }
    menu.addButton(name, () => propertyForm(key))
  }

  menu.show(player)
}

/**
 * @param {ModalForm<(args_0: any, args_1: string) => void>} form
 * @param {any} value
 */
function changeValue(form, value) {
  let type = typeof value
  const typeDropdown = ['string', 'number', 'boolean', 'object']
  if (value) typeDropdown.unshift('Оставить прежний §7(' + type + ')')
  const stringifiedValue = value ? (typeof value === 'object' ? JSON.stringify(value) : value + '') : ''
  const newform = form
    .addTextField('Значение', 'оставь пустым для отмены', stringifiedValue)
    .addDropdown('Тип', typeDropdown)

  return {
    newform,
    callback: (
      /** @type {any} */ input,
      /** @type {string} */ inputType,
      /** @type {(newValue: any) => void} */ onChange,
    ) => {
      let newValue = input

      if (
        !inputType.includes(type) &&
        (inputType === 'string' || inputType === 'object' || inputType === 'boolean' || inputType === 'number')
      ) {
        type = inputType
      }
      switch (type) {
        case 'number':
          newValue = Number(input)
          break

        case 'boolean':
          newValue = input === 'true'
          break

        case 'object':
          try {
            newValue = JSON.parse(input)
          } catch (e) {
            world.say('§4DB §cJSON.parse error: ' + e.message)
            return
          }

          break
      }
      onChange(newValue)
    },
  }
}

const cmd = new Command('benchmark')
  .setDescription('Показывает время работы серверных систем')
  .setPermissions('techAdmin')

cmd
  .string('type', true)
  .boolean('pathes', true)
  .boolean('useChat', true)
  .executes((ctx, type, pathes, useChat) => {
    if (type && !(type in util.benchmark.results))
      return ctx.error(
        'Неизвестный тип бенчмарка! Доступные типы: \n  §f' + Object.keys(util.benchmark.results).join('\n  '),
      )

    if (useChat) {
      return ctx.reply(stringifyBenchmarkResult({ type: type ?? 'timers', timerPathes: pathes ?? false }))
    }

    function show() {
      new ActionForm(
        'Benchmark',
        stringifyBenchmarkResult({
          type: type ?? 'timers',
          timerPathes: pathes ?? false,
        }),
      )
        .addButton('Refresh', null, show)
        .addButton('Exit', null, () => void 0)
        .show(ctx.player)
    }
    show()
  })
