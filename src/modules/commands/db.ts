/* i18n-ignore */

import { Player, system, world } from '@minecraft/server'
import { ArrayForm, ROLES, getRole, inspect, util } from 'lib'
import { UnknownTable, getProvider } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { i18n, noI18n } from 'lib/i18n/text'
import { stringifyBenchmarkResult } from './stringifyBenchmarkReult'

new Command('db')
  .setDescription('Просматривает базу данных')
  .setPermissions('techAdmin')
  .executes(ctx => selectTable(ctx.player, true))

function selectTable(player: Player, firstCall?: true) {
  const form = new ActionForm('Таблицы данных')
  for (const [tableId, table] of Object.entries(getProvider().tables)) {
    const name = noI18n`${tableId} ${`§7${table.size}`} ${getProvider().getRawTableData(tableId).length / (256 * 1024)}§r`

    form.button(name, () => showTable(player, tableId, table))
  }
  form.show(player)
  if (firstCall) player.info('Закрой чат!')
}

function showTable(player: Player, tableId: string, table: UnknownTable) {
  const selfback = () => showTable(player, tableId, table)
  const keys = [...table.keys()]
  new ArrayForm(`${tableId} ${keys.length}`, keys)
    .addCustomButtonBeforeArray(form => {
      form
        .button('§3Новое значение§r', () => {
          changeValue(player, null, (newVal, key) => table.set(key, newVal), selfback)
        })
        .ask('§cОчистить таблицу', 'ДААА УДАЛИТЬ ВСЕ НАФИГ', () => {
          for (const key of table.keys()) table.delete(key)
        })
    })
    .back(() => selectTable(player))
    .button(key => {
      let name = key
      if (tableId === 'player') {
        const playerDatabase = table as typeof Player.database
        name = `${playerDatabase.get(key).name} ${(ROLES[getRole(key)] as Text | undefined)?.to(player.lang) ?? '§7Без роли'}\n§8(${key})`
      } else {
        name += `\n§7${JSON.stringify(table.get(key)).slice(0, 200).replace(/"/g, '')}`
      }

      return [name, () => tableProperty(key, table, player, selfback)] as const
    })
    .show(player)
}

function tableProperty(key: string, table: UnknownTable, player: Player, back: VoidFunction) {
  key = key + ''
  let value: unknown
  let failedToLoad = false

  try {
    value = table.get(key)
  } catch (e) {
    console.error(e)
    value = 'a'
    failedToLoad = true
  }

  new ActionForm(
    '§3Ключ ' + key,
    `§7Тип: §f${typeof value}\n ${failedToLoad ? '\n§cОшибка при получении данных из таблицы!§r\n\n' : ''}\n${inspect(value)}\n `,
  )
    .button('Изменить', () =>
      changeValue(
        player,
        value,
        newValue => {
          table.set(key, newValue)
          player.tell(inspect(value) + '§r -> ' + inspect(newValue))
        },
        () => tableProperty(key, table, player, back),
        key,
      ),
    )
    .button('Переименовать', () => {
      new ModalForm('Переименовать').addTextField('Ключ', 'останется прежним', key).show(player, (ctx, newKey) => {
        if (newKey) {
          player.success(i18n`Renamed ${key} -> ${newKey}`)
          table.set(newKey, table.get(key))
        } else player.info(i18n`Key ${key} left as is`)
      })
    })
    .button(noI18n.error`Удалить`, () => {
      table.delete(key)
      system.delay(back)
    })
    .addButtonBack(back, player.lang)
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
  .setAliases('bench')
  .setDescription('Показывает время работы серверных систем')
  .setPermissions('techAdmin')

cmd
  .string('type', true)
  .boolean('pathes', true)
  .boolean('sort', true)
  .array('output', ['form', 'chat', 'log'], true)
  .executes((ctx, type = 'timers', timerPathes = false, sort = true, output = 'form') => {
    if (!(type in util.benchmark.results))
      return ctx.error(
        'Неизвестный тип бенчмарка! Доступные типы: \n  §f' + Object.keys(util.benchmark.results).join('\n  '),
      )

    const result = stringifyBenchmarkResult({ type: type, timerPathes, sort })

    switch (output) {
      case 'form': {
        const show = () => {
          new ActionForm('Benchmark', result)
            .button('Refresh', null, show)
            .button('Exit', null, () => void 0)
            .show(ctx.player)
        }
        return show()
      }
      case 'chat':
        return ctx.reply(result)
      case 'log':
        return console.log(result)
    }
  })
