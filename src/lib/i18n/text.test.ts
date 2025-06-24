import 'lib/command/index'

import { Player } from '@minecraft/server'
import { ms } from 'lib'
import { Language } from 'lib/assets/lang'
import { TEST_createPlayer } from 'test/utils'
import { Message } from './message'
import './text'
import { i18n, t, textTable } from './text'

let player: Player
beforeEach(() => {
  player = TEST_createPlayer()
})

describe('i18n', () => {
  it('should translate text', () => {
    expect(i18n`Some string with ${i18n.time(3000)} and`.size(30).string(Language.en_US)).toMatchInlineSnapshot(
      `"§7Some string with §f3 seconds§7 and§7 §7(§630§7)"`,
    )
  })
})

describe('text', () => {
  it('should create text', () => {
    expect(t`Some string ${'that colors'} properly ${5} times`).toMatchInlineSnapshot(
      `"§7Some string §fthat colors§7 properly §65§7 times§7"`,
    )
    expect(t`Some string with ${player}`).toMatchInlineSnapshot(`"§7Some string with §fTest player name§7"`)
  })

  it('should create nested text', () => {
    expect(t`А мы любим ${t`вложенные роли этого чела: ${player}`}`).toMatchInlineSnapshot(
      `"§7А мы любим §f§7вложенные роли этого чела: §fTest player name§7§7"`,
    )
  })

  it('should apply options', () => {
    expect(t.colors({ unit: '§g', text: '§4' })`Все должно работать ${player}`).toMatchInlineSnapshot(
      `"§4Все должно работать §gTest player name§4"`,
    )

    expect(t.error`Не так быстро! Попробуй через ${t.time(3000)}`).toMatchInlineSnapshot(
      `"§cНе так быстро! Попробуй через §f3 секунды§c"`,
    )
  })

  it('should print errored text', () => {
    expect(
      t.error`Много текста ${'длинной'} и полезной в ${5} степени ошибки, произведенной игроком ${player}`,
    ).toMatchInlineSnapshot(
      `"§cМного текста §fдлинной§c и полезной в §75§c степени ошибки, произведенной игроком §fTest player name§c"`,
    )
  })

  it('should stringify command', () => {
    expect(t`Используй ${new Command('namew')}`).toMatchInlineSnapshot(`"§7Используй §f.namew§7"`)
  })

  it('should stringify chained command without overload', () => {
    const nameCommand = new Command('nameww')
    nameCommand.overload('overload')
    expect(t`Используй ${nameCommand}`).toMatchInlineSnapshot(`"§7Используй §f.nameww§7"`)
  })

  it('should stringify chained command overload', () => {
    expect(t`Используй ${new Command('name').overload('overload')}`).toMatchInlineSnapshot(
      `"§7Используй §f.name overload§7"`,
    )
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
      `"§7Символы то тоже сюда кидают: §c<>§7"`,
    )
  })

  it('should stringify function', () => {
    expect(t`Фнукции то тоже сюда кидают: ${() => {}}`).toMatchInlineSnapshot(`"§7Фнукции то тоже сюда кидают: §c<>§7"`)
  })

  it('should stringify undefined', () => {
    expect(t`Пустоту то тоже сюда кидают: ${undefined}`).toMatchInlineSnapshot(`"§7Пустоту то тоже сюда кидают: §7"`)
  })

  it('should stringify in error mode with nested options', () => {
    expect(
      t.error`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"§cSome long text §fwith error§c and number §74§c and player §fTest player name§c"`)
  })

  it('should stringify in accent with nested options', () => {
    expect(
      t.accent`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"§3Some long text §fwith error§3 and number §64§3 and player §fTest player name§3"`)
  })

  it('should stringify in warn with nested options', () => {
    expect(
      t.warn`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"§eSome long text §fwith error§e and number §64§e and player §fTest player name§e"`)
  })

  it('should stringify in without color with nested options', () => {
    expect(
      t.nocolor`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"Some long text with error and number 4 and player Test player name"`)
  })
  it('should stringify in header with nested options', () => {
    expect(
      t.header`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(
      `"§r§6Some long text §f§lwith error§r§6 and number §f4§r§6 and player §f§lTest player name§r§6"`,
    )
  })

  it('should work with time', () => {
    const lang = Language.ru_RU
    expect(t.time(0).string(lang)).toMatchInlineSnapshot(`""`)
    expect(t.time(3000).string(lang)).toMatchInlineSnapshot(`"3 секунды"`)
    expect(t.time(300000).string(lang)).toMatchInlineSnapshot(`"5 минут"`)

    expect(t.timeHHMMSS(3000)).toMatchInlineSnapshot(`"00:00:03"`)
    expect(t.timeHHMMSS(ms.from('hour', 4) + ms.from('min', 32) + ms.from('sec', 1))).toMatchInlineSnapshot(
      `"04:32:01"`,
    )
    expect((t.timeHHMMSS(ms.from('day', 100) + 3000) as Message).string(lang)).toMatchInlineSnapshot(
      `"100 дней, 00:00:03"`,
    )

    expect(t.error.timeHHMMSS(3000)).toMatchInlineSnapshot(`"00:00:03"`)
    expect((t.error.timeHHMMSS(ms.from('day', 100) + 3000) as Message).string(lang)).toMatchInlineSnapshot(
      `"100 дней, 00:00:03"`,
    )
  })

  it('should work with badge', () => {
    expect(t.badge(-3)).toMatchInlineSnapshot(`"§4 (§c-3§4)"`)
    expect(t.badge(3)).toMatchInlineSnapshot(`"§4 (§c3§4)"`)
    expect(t.badge(0)).toMatchInlineSnapshot(`""`)

    expect(t.size(3)).toMatchInlineSnapshot(`"§7 (§63§7)"`)
    expect(t.size(0)).toMatchInlineSnapshot(`""`)
    expect(t.error.size(3)).toMatchInlineSnapshot(`"§c (§73§c)"`)
    expect(t.error.size(0)).toMatchInlineSnapshot(`""`)
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
      textTable([
        ['Ключ', 'значение'],
        ['Другой ключ', 2],
        ['Игрок', player],
      ]),
    ).toMatchInlineSnapshot(`
      "§7Ключ: §fзначение
      §7Другой ключ: §62
      §7Игрок: §fTest player name"
    `)

    expect(
      textTable([
        ['Ключ', 'значение'],
        ['Другой ключ', 2],
        ['Другой клsюч', 2],
        ['Другой клssюч', 2],
        ['Другой клsssюч', 2],
        ['Другой клssssюч', 2],
        ['Другой клsssssюч', 2],
        ['Игрок', player],
      ]),
    ).toMatchInlineSnapshot(`
      "§fКлюч: §fзначение
      §7Другой ключ: §62
      §fДругой клsюч: §62
      §7Другой клssюч: §62
      §fДругой клsssюч: §62
      §7Другой клssssюч: §62
      §fДругой клsssssюч: §62
      §7Игрок: §fTest player name"
    `)
  })

  it('should create array', () => {
    expectTypeOf(textTable([])).toBeString()
    expectTypeOf(textTable([], true)).toBeString()

    expectTypeOf(textTable([], false)).toBeArray()

    expect(textTable([['key', 'value']], false)).toEqual(['§7key: §fvalue'])
  })
})
