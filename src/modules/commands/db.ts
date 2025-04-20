/* i18n-ignore */

import { Player, system, world } from '@minecraft/server'
import { ArrayForm, ROLES, getRole, inspect, util } from 'lib'
import { DatabaseTable, getProvider } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { t } from 'lib/text'
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
  const keys = Object.keys(table)
  new ArrayForm(`${tableId} ${keys.length}`, keys)
    .addCustomButtonBeforeArray(form => {
      form
        .addButton('§3Новое значение§r', () => {
          changeValue(player, null, (newVal, key) => (table[key] = newVal), selfback)
        })
        .addButtonAsk('§cОчистить таблицу', 'ДААА УДАЛИТЬ ВСЕ НАФИГ', () => {
          Object.keys(table).forEach(e => Reflect.deleteProperty(table, e))
        })
    })
    .back(() => selectTable(player))
    .button(key => {
      let name = key
      if (tableId === 'player') {
        const playerDatabase = table as typeof Player.database
        name = `${playerDatabase[key].name} ${(ROLES[getRole(key)] as string | undefined) ?? '§7Без роли'}\n§8(${key})`
      } else {
        name += `\n§7${JSON.stringify(table[key]).slice(0, 200).replace(/"/g, '')}`
      }

      return [name, () => tableProperty(key, table, player, selfback)] as const
    })
    .show(player)
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
    `§7Тип: §f${typeof value}\n ${failedToLoad ? '\n§cОшибка при получении данных из таблицы!§r\n\n' : ''}\n${inspect(value)}\n `,
  )
    .addButton('Изменить', () =>
      changeValue(
        player,
        value,
        newValue => {
          table[key] = newValue
          Reflect.deleteProperty(table, key)
          player.tell(inspect(value) + '§r -> ' + inspect(newValue))
        },
        () => tableProperty(key, table, player, back),
        key,
      ),
    )
    .addButton('Переименовать', () => {
      new ModalForm('Переименовать').addTextField('Ключ', 'останется прежним', key).show(player, (ctx, newKey) => {
        if (newKey) {
          player.success(t`Renamed ${key} -> ${newKey}`)
          table[newKey] = table[key]
        } else player.info(t`Key ${key} left as is`)
      })
    })
    .addButton('§cУдалить§r', () => {
      Reflect.deleteProperty(table, key)
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
  const stringifiedValue = value ? JSON.stringify(value) : ''

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
          } catch (e: unknown) {
            world.say(`§4DB §cJSON.parse error: ${(e as Error).message}`)
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
