import 'lib/command/index'

import { Player } from '@minecraft/server'
import { ms } from 'lib'
import { Language } from 'lib/assets/lang'
import { TEST_createPlayer } from 'test/utils'
import { Message } from './message'
import './text'
import { i18n, textTable } from './text'

let player: Player
beforeEach(() => {
  player = TEST_createPlayer()
})

describe('i18n', () => {
  it('should translate text', () => {
    expect(i18n`Some string with ${i18n.time(3000)} and`.size(30).toString(Language.en_US)).toMatchInlineSnapshot(
      `"§7Some string with §f3 seconds§7 and§7 §7(§630§7)"`,
    )

    expect(i18n`Гробовщику посвящается`.toString(Language.en_US)).toMatchInlineSnapshot(`"For Gravestoner"`)

    expect(i18n`Вы были выгнаны из клана игроком '${1}'. Причина: ${2}`.toString(Language.en_US)).toMatchInlineSnapshot(
      `"§7You were kicked from the clan by player '§61§7'. Reason: §62§7"`,
    )
  })
})

describe('text', () => {
  it('should create text', () => {
    expect(i18n`Some string ${'that colors'} properly ${5} times`).toMatchInlineSnapshot(
      `"§7Some string §fthat colors§7 properly §65§7 times"`,
    )
    expect(i18n`Some string with ${player}`).toMatchInlineSnapshot(`"§7Some string with §fTest player name§7"`)

    expect(i18n`Some string ${'§lthat colors'} properly ${5} times`).toMatchInlineSnapshot(
      `"§7Some string §f§lthat colors§7 properly §65§7 times"`,
    )
  })

  it('should create nested text', () => {
    expect(i18n`Nested ${i18n`nested: ${player}`}`).toMatchInlineSnapshot(`"§7Nested §7nested: §fTest player name§7§7"`)
  })

  it('should apply options', () => {
    expect(i18n.colors({ unit: '§g', text: '§4' })`Все должно работать ${player}`).toMatchInlineSnapshot(
      `"§4Все должно работать §gTest player name§4"`,
    )

    expect(i18n.error`Не так быстро! Попробуй через ${i18n.time(3000)}`).toMatchInlineSnapshot(
      `"§cНе так быстро! Попробуй через §f3 секунды§c"`,
    )
  })

  it('should print errored text', () => {
    expect(
      i18n.error`Много текста ${'длинной'} и полезной в ${5} степени ошибки, произведенной игроком ${player}`,
    ).toMatchInlineSnapshot(
      `"§cМного текста §fдлинной§c и полезной в §75§c степени ошибки, произведенной игроком §fTest player name§c"`,
    )
  })

  it('should stringify command', () => {
    expect(i18n`Используй ${new Command('namew')}`).toMatchInlineSnapshot(`"§7Используй §f.namew§7"`)
  })

  it('should stringify chained command without overload', () => {
    const nameCommand = new Command('nameww')
    nameCommand.overload('overload')
    expect(i18n`Используй ${nameCommand}`).toMatchInlineSnapshot(`"§7Используй §f.nameww§7"`)
  })

  it('should stringify chained command overload', () => {
    expect(i18n`Используй ${new Command('name').overload('overload')}`).toMatchInlineSnapshot(
      `"§7Используй §f.name overload§7"`,
    )
  })

  it('should stringify object', () => {
    expect(i18n`Объекты то тоже сюда кидают: ${{ value: true }}`).toMatchInlineSnapshot(`
      "§7Объекты то тоже сюда кидают: {
        value: §6true§r
      }§7"
    `)
  })

  it('should stringify symbol', () => {
    expect(i18n`Символы то тоже сюда кидают: ${Symbol('test')}`).toMatchInlineSnapshot(
      `"§7Символы то тоже сюда кидают: §c<>§7"`,
    )
  })

  it('should stringify function', () => {
    expect(i18n`Фнукции то тоже сюда кидают: ${() => {}}`).toMatchInlineSnapshot(
      `"§7Фнукции то тоже сюда кидают: §c<>§7"`,
    )
  })

  it('should stringify undefined', () => {
    expect(i18n`Пустоту то тоже сюда кидают: ${undefined}`).toMatchInlineSnapshot(`"§7Пустоту то тоже сюда кидают: §7"`)
  })

  it('should stringify in error mode with nested options', () => {
    expect(
      i18n.error`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"§cSome long text §fwith error§c and number §74§c and player §fTest player name§c"`)
  })

  it('should stringify in accent with nested options', () => {
    expect(
      i18n.accent`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"§3Some long text §fwith error§3 and number §64§3 and player §fTest player name§3"`)
  })

  it('should stringify in success with nested options', () => {
    expect(
      i18n.success`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"§aSome long text §fwith error§a and number §64§a and player §fTest player name§a"`)
  })

  it('should change colors after', () => {
    const msg = i18n.success`Some long text ${'with error'} and number ${4}`
    expect(msg.toString(Language.en_US)).toMatchInlineSnapshot(`"§aSome long text §fwith error§a and number §64§a"`)

    expect(msg.color(i18n.disabled).toString(Language.en_US)).toMatchInlineSnapshot(
      `"§8Some long text §7with error§8 and number §74§8"`,
    )
  })

  it('should stringify in warn with nested options', () => {
    expect(
      i18n.warn`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"§eSome long text §fwith error§e and number §64§e and player §fTest player name§e"`)
  })

  it('should stringify in without color with nested options', () => {
    expect(
      i18n.nocolor`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(`"Some long text with error and number 4 and player Test player name"`)
  })
  it('should stringify in header with nested options', () => {
    expect(
      i18n.header`Some long text ${'with error'} and number ${4} and player ${TEST_createPlayer()}`,
    ).toMatchInlineSnapshot(
      `"§r§6Some long text §f§lwith error§r§6 and number §f4§r§6 and player §f§lTest player name§r§6"`,
    )
  })

  it('should work with time', () => {
    const lang = Language.ru_RU
    expect(i18n.time(0).toString(lang)).toMatchInlineSnapshot(`""`)
    expect(i18n.time(3000).toString(lang)).toMatchInlineSnapshot(`"3 секунды"`)
    expect(i18n.time(300000).toString(lang)).toMatchInlineSnapshot(`"5 минут"`)
    expect(i18n.time(300000).toString(Language.en_US)).toMatchInlineSnapshot(`"5 minutes"`)

    expect(i18n.hhmmss(3000)).toMatchInlineSnapshot(`"00:00:03"`)
    expect(i18n.hhmmss(ms.from('hour', 4) + ms.from('min', 32) + ms.from('sec', 1))).toMatchInlineSnapshot(`"04:32:01"`)
    expect((i18n.hhmmss(ms.from('day', 100) + 3000) as Message).toString(lang)).toMatchInlineSnapshot(
      `"100 дней, 00:00:03"`,
    )

    expect(i18n.error.hhmmss(3000)).toMatchInlineSnapshot(`"00:00:03"`)
    expect((i18n.error.hhmmss(ms.from('day', 100) + 3000) as Message).toString(lang)).toMatchInlineSnapshot(
      `"100 дней, 00:00:03"`,
    )
  })

  it('should work with badge', () => {
    const lang = Language.en_US
    expect(i18n`Text`.badge(-3).toString(lang)).toMatchInlineSnapshot(`"§7Text§7 §4(§c-3§4)"`)
    expect(i18n`Text`.badge(3).toString(lang)).toMatchInlineSnapshot(`"§7Text§7 §4(§c3§4)"`)
    expect(i18n`Text`.badge(0).toString(lang)).toMatchInlineSnapshot(`"Text"`)

    expect(i18n`Size`.size(3).toString(lang)).toMatchInlineSnapshot(`"§7Size§7 §7(§63§7)"`)
    expect(i18n`Size`.size(0).toString(lang)).toMatchInlineSnapshot(`"Size"`)
    expect(i18n.nocolor`Size`.size(3).toString(lang)).toMatchInlineSnapshot(`"Size (3)"`)
    expect(i18n.nocolor`Size`.size(0).toString(lang)).toMatchInlineSnapshot(`"Size"`)
    expect(i18n.error`Size`.size(3).toString(lang)).toMatchInlineSnapshot(`"§cSize§c §c(§73§c)"`)
    expect(i18n.error`Size`.size(0).toString(lang)).toMatchInlineSnapshot(`"§cSize"`)
  })
})

describe('textTable', () => {
  it('should create text table', () => {
    const player = TEST_createPlayer()
    expect(
      textTable([
        ['Ключ', 'значение'],
        ['Другой ключ', 2],
        ['Игрок', player],
      ]).toString(player.lang),
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
        ['Другой клssssюч', i18n.time(3202)],
        ['Другой клsssssюч', 2],
        ['Игрок', player],
      ]).toString(player.lang),
    ).toMatchInlineSnapshot(`
      "§fКлюч: §fзначение
      §7Другой ключ: §62
      §fДругой клsюч: §62
      §7Другой клssюч: §62
      §fДругой клsssюч: §62
      §7Другой клssssюч: §f3 секунды
      §fДругой клsssssюч: §62
      §7Игрок: §fTest player name"
    `)
  })

  it('should create array', () => {
    const player = TEST_createPlayer()
    expect(textTable([['key', 'value']]).toString(player.lang)).toMatchInlineSnapshot(`"§7key: §fvalue"`)
  })
})
