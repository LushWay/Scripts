import 'lib/database/player'
import 'lib/load/enviroment'

import 'lib/command/index'

import { Player } from '@minecraft/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { setRole } from './roles'
import './text'
import { t, textTable } from './text'
import { util } from './util'

let player: Player
beforeEach(() => {
  // @ts-expect-error
  player = new Player()
})

describe('text', () => {
  it('should create text', () => {
    console.log(t`Some string ${'that colors'} properly ${5} times`)
    console.log(t`Some string ${'that colors'} properly ${5} times`)
    console.log(t`Some string with ${player}`)
  })

  it('should create text with roles', () => {
    setRole(player, 'admin')
    expect(t.roles`Строка с ${player}`).toMatchInlineSnapshot(`"§7Строка с §5Админ§r §fTest player name§7"`)
  })

  it('should create nested text', () => {
    console.log(t`А мы любим ${t.roles`вложенные роли этого чела: ${player}`}`)
  })

  it('should apply options', () => {
    expect(t.options({ unitColor: '§g', textColor: '§4' }).roles`Все должно работать ${player}`).toMatchInlineSnapshot(
      `"§4Все должно работать §5Админ§r §gTest player name§4"`,
    )
  })

  it('should print errored text', () => {
    expect(
      t.error`Много текста ${'длинной'} и полезной в ${5} степени ошибки, произведенной игроком ${player}`,
    ).toMatchInlineSnapshot(
      `"§7Много текста §fдлинной§7 и полезной в §65§r§7 степени ошибки, произведенной игроком §fTest player name§7"`,
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

    const text = util.ngettext(n, ['блок', 'блока', 'блоков'])
    expect(`§7Было сломано §6${n} §7${text}`).toMatchInlineSnapshot(`"§7Было сломано §610 §7блоков"`)

    expect(t.num`Было сломано ${n} ${['блок', 'блока', 'блоков']}`).toMatchInlineSnapshot(
      `"§7Было сломано §610§7 блоков"`,
    )
  })

  it('should work with badge', () => {
    expect(t.badge`Письма ${-3}`).toMatchInlineSnapshot(`"§7Письма§7"`)
    expect(t.badge`Письма ${0}`).toMatchInlineSnapshot(`"§7Письма§7"`)
    expect(t.badge`Письма ${3}`).toMatchInlineSnapshot(`"§7Письма §8(§c3§8)§7"`)
  })
})

describe('textTable', () => {
  it('should create text table', () => {
    console.log(
      textTable({
        'Ключ': 'значение',
        'Другой ключ': 2,
        'Игрок': player,
      }),
    )
  })
})
