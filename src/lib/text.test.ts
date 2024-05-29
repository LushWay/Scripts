import 'lib/database/player'
import 'lib/load/enviroment'

import { Player } from '@minecraft/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { setRole } from './roles'
import './text'
import { t, textTable } from './text'

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
    expect(t.roles`Строка с ${player}`).toMatchInlineSnapshot(`"§7Строка с §5Админ§r §fTest player name§7§7"`)
  })

  it('should create nested text', () => {
    console.log(t`А мы любим ${t.roles`вложенные роли этого чела: ${player}`}`)
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
