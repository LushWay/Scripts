import 'lib/command/index'

import { Player } from '@minecraft/server'
import { ms } from 'lib'
import { TEST_createPlayer } from 'test/utils'
import './text'
import { t, textTable } from './text'

let player: Player
beforeEach(() => {
  player = TEST_createPlayer()
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
    expect(t.options({ unit: '§g', text: '§4' })`Все должно работать ${player}`).toMatchInlineSnapshot(
      `"§4Все должно работать §gTest player name§4"`,
    )

    expect(t.error`Не так быстро! Попробуй через ${t.error.time(3000)}`).toMatchInlineSnapshot(
      `"§cНе так быстро! Попробуй через §f§c§f3 §cсекунды§c§c"`,
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

  it('should stringify chained command', () => {
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
    expect(t.error`Some ${'with error'} ${4} ${TEST_createPlayer()}`).toMatchInlineSnapshot(
      `"§cSome §fwith error§c §74§c §fTest player name§c"`,
    )
  })

  it('should work with time', () => {
    expect(t.time(0)).toMatchInlineSnapshot(`"§7§f0 §7миллисекунд§7"`)
    expect(t.time(3000)).toMatchInlineSnapshot(`"§7§f3 §7секунды§7"`)
    expect(t.time(300000)).toMatchInlineSnapshot(`"§7§f5 §7минут§7"`)

    expect(t.timeHHMMSS(3000)).toMatchInlineSnapshot(`"§600:00:03§7"`)
    expect(t.timeHHMMSS(ms.from('hour', 4) + ms.from('min', 32) + ms.from('sec', 1))).toMatchInlineSnapshot(
      `"§604:32:01§7"`,
    )
    expect(t.timeHHMMSS(ms.from('day', 100) + 3000)).toMatchInlineSnapshot(`"§6100 §7дней, §600:00:03§7"`)

    expect(t.error.timeHHMMSS(3000)).toMatchInlineSnapshot(`"§700:00:03§c"`)
    expect(t.error.timeHHMMSS(ms.from('day', 100) + 3000)).toMatchInlineSnapshot(`"§7100 §cдней, §700:00:03§c"`)

    // @ts-expect-error
    expect(t.time('string')).toMatchInlineSnapshot(`"§7§fstring§7"`)
  })

  it('should work with badge', () => {
    expect(t.unreadBadge`Почта ${-3}`).toMatchInlineSnapshot(`"§7Почта§7"`)
    expect(t.unreadBadge`Почта ${0}`).toMatchInlineSnapshot(`"§7Почта§7"`)
    expect(t.unreadBadge`Почта ${3}`).toMatchInlineSnapshot(`"§7Почта §7(§c3§7)§7"`)
    expect(t.unreadBadge`${3}`).toMatchInlineSnapshot(`"§7§7(§c3§7)§7"`)
    expect(t.unreadBadge`${0}`).toMatchInlineSnapshot(`"§7§7"`)

    expect(t.size(3)).toMatchInlineSnapshot(`"§7 (§63§7)§7"`)
    expect(t.size(0)).toMatchInlineSnapshot(`""`)
    expect(t.error.size(3)).toMatchInlineSnapshot(`"§c (§73§c)§c"`)
    expect(t.error.size(0)).toMatchInlineSnapshot(`""`)

    // @ts-expect-error
    expect(t.unreadBadge`Плохо${'string'}`).toMatchInlineSnapshot(`"§7Плохо§fstring§7"`)
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

    expect(
      textTable({
        'Ключ': 'значение',
        'Другой ключ': 2,
        'Другой клsюч': 2,
        'Другой клssюч': 2,
        'Другой клsssюч': 2,
        'Другой клssssюч': 2,
        'Другой клsssssюч': 2,
        'Игрок': player,
      }),
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
    expectTypeOf(textTable({})).toBeString()
    expectTypeOf(textTable({}, true)).toBeString()

    expectTypeOf(textTable({}, false)).toBeArray()

    expect(textTable({ key: 'value' }, false)).toEqual(['§7key: §fvalue'])
  })
})
