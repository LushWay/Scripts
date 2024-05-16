import { Player, system, world } from '@minecraft/server'
import { ROLES, getRole, util } from 'lib'
import { DatabaseTable, getProvider } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { stringifyBenchmarkResult } from './stringifyBenchmarkReult'

new Command('db')
  .setDescription('Просматривает базу данных')
  .setPermissions('techAdmin')
  .executes(ctx => selectTable(ctx.player, true))

function selectTable(player: Player, firstCall?: true) {
  const form = new ActionForm('Таблицы данных')
  for (const [tableId, table] of Object.entries(getProvider().tables)) {
    const name = `${tableId} §7${Object.keys(table).length}§r`

    form.addButton(name, () => showTable(player, tableId, table))
  }
  form.show(player)
  if (firstCall) player.info('Закрой чат!')
}

function showTable(player: Player, tableId: string, table: DatabaseTable) {
  const selfback = () => showTable(player, tableId, table)
  const menu = new ActionForm(`${table}`)

  menu.addButton(ActionForm.backText, () => selectTable(player))
  menu.addButton('§3Новое значение§r', () => {
    changeValue(
      player,
      null,
      (newVal, key) => {
        table[key] = newVal
      },
      selfback,
    )
  })

  menu.addButton('§3Посмотреть в §fRAW', () => {
    let raw = getProvider().getRawTableData(tableId)
    try {
      if (typeof raw === 'string') raw = JSON.parse(raw)
    } catch {}

    new ActionForm('§3RAW table §f' + table, util.inspect(raw)).addButton('Oк', selectTable).show(player)
  })

  const keys = Object.keys(table)
  for (const key of keys) {
    let name = key
    if (tableId === 'player') {
      const playerDatabase = table as typeof Player.database

      name = `${playerDatabase[key].name} ${ROLES[getRole(key)] ?? '§7Без роли'}\n§8(${key})`
    }

    menu.addButton(name, () => tableProperty(key, table, player, selfback))
  }

  menu.show(player)
}

function tableProperty(key: string, table: DatabaseTable, player: Player, back: VoidFunction) {
  key = key + ''
  let value: unknown
  let failedToLoad = false

  try {
    value = table[key]
  } catch (e) {
    console.error(e)
    value = 'a'
    failedToLoad = true
  }

  new ActionForm(
    '§3Ключ ' + key,
    `§7Тип: §f${typeof value}\n ${failedToLoad ? '\n§cОшибка при получении данных из таблицы!§r\n\n' : ''}\n${util.inspect(value)}\n `,
  )
    .addButton('Изменить', () =>
      changeValue(
        player,
        value,
        newValue => {
          table[key] = newValue
          player.tell(util.inspect(value) + '§r -> ' + util.inspect(newValue))
        },
        () => tableProperty(key, table, player, back),
        key,
      ),
    )
    .addButton('§cУдалить§r', () => {
      delete table[key]
      system.delay(back)
    })
    .addButtonBack(back)
    .show(player)
}

function changeValue(
  player: Player,
  value: unknown,
  onChange: (value: unknown, key: string) => void,
  back: VoidFunction,
  key?: string,
) {
  let valueType = typeof value
  const typeDropdown = ['string', 'number', 'boolean', 'object']
  if (value) typeDropdown.unshift('Оставить прежний §7(' + valueType + ')')
  const stringifiedValue = value ? (typeof value === 'object' ? JSON.stringify(value) : value + '') : ''

  new ModalForm('§3+Значение ')
    .addTextField('Ключ', ' ', key)
    .addTextField('Значение', 'оставь пустым для отмены', stringifiedValue)
    .addDropdown('Тип', typeDropdown)
    .show(player, (ctx, key, input: string, type: string) => {
      if (!input) back()
      let newValue: unknown = input

      if (
        !type.includes(valueType) &&
        (type === 'string' || type === 'object' || type === 'boolean' || type === 'number')
      ) {
        valueType = type
      }
      switch (valueType) {
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
      onChange(newValue, key)
    })
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
