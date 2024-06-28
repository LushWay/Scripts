import 'lib/database/player'
import 'lib/load/enviroment'

import 'lib/command/index'

import { Player } from '@minecraft/server'
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest'
import { setRole } from './roles'
import './text'
import { ngettext, t, textTable } from './text'

let player: Player
beforeEach(() => {
  // @ts-expect-error
  player = new Player()
})

describe('text', () => {
  it('should create text', () => {
    expect(t`Some string ${'that colors'} properly ${5} times`).toMatchInlineSnapshot(
      `"§7Some string §fthat colors§7 properly §65§7 times§7"`,
    )
    expect(t`Some string with ${player}`).toMatchInlineSnapshot(`"§7Some string with §fTest player name§7"`)
  })

  it('should create text with roles', () => {
    setRole(player, 'admin')
    expect(t.roles`Строка с ${player}`).toMatchInlineSnapshot(`"§7Строка с §5Админ§r §fTest player name§7"`)
  })

  it('should create nested text', () => {
    expect(t`А мы любим ${t.roles`вложенные роли этого чела: ${player}`}`).toMatchInlineSnapshot(
      `"§7А мы любим §f§7вложенные роли этого чела: §5Админ§r §fTest player name§7§7"`,
    )
  })

  it('should apply options', () => {
    expect(t.options({ unit: '§g', text: '§4' }).roles`Все должно работать ${player}`).toMatchInlineSnapshot(
      `"§4Все должно работать §5Админ§r §gTest player name§4"`,
    )
  })

  it('should print errored text', () => {
    expect(
      t.error`Много текста ${'длинной'} и полезной в ${5} степени ошибки, произведенной игроком ${player}`,
    ).toMatchInlineSnapshot(
      `"§cМного текста §fдлинной§c и полезной в §65§c степени ошибки, произведенной игроком §fTest player name§c"`,
    )
  })

  it('should stringify command', () => {
    expect(t`Используй ${new Command('name')}`).toMatchInlineSnapshot(`"§7Используй §f.name§7"`)
  })

  it('should stringify object', () => {
    expect(t`Объекты то тоже сюда кидают: ${{ value: true }}`).toMatchInlineSnapshot(`
      "§7Объекты то тоже сюда кидают: {
        value: §6true§r
      }§7"
    `)
  })

  it('should stringify symbol', () => {
    expect(t`Символы то тоже сюда кидают: ${Symbol('test')}`).toMatchInlineSnapshot(
      `"§7Символы то тоже сюда кидают: §c<>§r§7"`,
    )
  })

  it('should stringify function', () => {
    expect(t`Фнукции то тоже сюда кидают: ${() => {}}`).toMatchInlineSnapshot(
      `"§7Фнукции то тоже сюда кидают: §c<>§r§7"`,
    )
  })

  it('should stringify undefined', () => {
    expect(t`Пустоту то тоже сюда кидают: ${undefined}`).toMatchInlineSnapshot(`"§7Пустоту то тоже сюда кидают: §7"`)
  })

  it('should stringify in error mode with nested options', () => {
    expect(t.error)
  })

  it('should stringify num with plurals', () => {
    const n = 10

    const text = ngettext(n, ['блок', 'блока', 'блоков'])
    expect(`§7Было сломано §6${n} §7${text}`).toMatchInlineSnapshot(`"§7Было сломано §610 §7блоков"`)

    expect(t.num`Было сломано ${n} ${['блок', 'блока', 'блоков']}`).toMatchInlineSnapshot(
      `"§7Было сломано §610§7 блоков§7"`,
    )
  })

  it('should work with time', () => {
    expect(t.time`Прошло ${0}`).toMatchInlineSnapshot(`"§7Прошло §f0 §7миллисекунд§7"`)
    expect(t.time`Прошло ${3000}`).toMatchInlineSnapshot(`"§7Прошло §f3 §7секунды§7"`)
    expect(t.time`Прошло ${300000}`).toMatchInlineSnapshot(`"§7Прошло §f5 §7минут§7"`)

    // @ts-expect-error
    expect(t.time`Плохо${'string'}`).toMatchInlineSnapshot(`"§7Плохо§fstring§7"`)
  })

  it('should work with badge', () => {
    expect(t.badge`Письма ${-3}`).toMatchInlineSnapshot(`"§7Письма§7"`)
    expect(t.badge`Письма ${0}`).toMatchInlineSnapshot(`"§7Письма§7"`)
    expect(t.badge`Письма ${3}`).toMatchInlineSnapshot(`"§7Письма §8(§c3§8)§7"`)
    expect(t.badge`${3}`).toMatchInlineSnapshot(`"§7§8(§c3§8)§7"`)
    expect(t.badge`${0}`).toMatchInlineSnapshot(`"§7§7"`)

    // @ts-expect-error
    expect(t.badge`Плохо${'string'}`).toMatchInlineSnapshot(`"§7Плохо§fstring§7"`)
  })

  it('should work with rawTxt', () => {
    expect(t.raw`Common text`).toMatchInlineSnapshot(`
      {
        "rawtext": [
          {
            "text": "§7",
          },
          {
            "text": "Common text",
          },
        ],
      }
    `)

    const rawText = { text: 'value' }
    const ttt = t.raw`${rawText}`
    expect(ttt).toMatchInlineSnapshot(`
      {
        "rawtext": [
          {
            "text": "§7",
          },
          {
            "text": "",
          },
          {
            "text": "§f",
          },
          {
            "text": "value",
          },
          {
            "text": "§7",
          },
          {
            "text": "",
          },
        ],
      }
    `)
    expect(ttt.rawtext?.[3]).toBe(rawText)
  })
})

describe('textTable', () => {
  it('should create text table', () => {
    expect(
      textTable({
        'Ключ': 'значение',
        'Другой ключ': 2,
        'Игрок': player,
      }),
    ).toMatchInlineSnapshot(`
      "§7Ключ: §fзначение
      §7Другой ключ: §62
      §7Игрок: §fTest player name"
    `)
  })

  it('should create array', () => {
    expectTypeOf(textTable({})).toBeString()
    expectTypeOf(textTable({}, true)).toBeString()

    expectTypeOf(textTable({}, false)).toBeArray()

    expect(textTable({ key: 'value' }, false)).toEqual(['§7key: §fvalue'])
  })
})
