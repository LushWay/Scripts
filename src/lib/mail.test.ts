import 'lib/extensions/player'

import { Mail } from 'lib/mail'
import { Rewards } from 'lib/shop/rewards'
import { beforeEach, describe, expect, it } from 'vitest'

describe('mail', () => {
  beforeEach(() => {
    function clear(database: Record<string, unknown>) {
      Object.keys(database).forEach(e => Reflect.deleteProperty(database, e))
    }

    clear(Mail.dbGlobal)
    clear(Mail.dbPlayers)
  })

  it('should send mail', () => {
    Mail.send('playerId', 'Some mail', 'Content', new Rewards())

    expect(Mail.getUnreadMessagesCount('playerId')).toBe(1)
  })

  it('should send serializeable mail', () => {
    Mail.send('playerId', 'Some mail', 'Content', new Rewards())

    expect(Mail.getLetters('playerId')).toMatchInlineSnapshot(`
      [
        {
          "index": 0,
          "letter": {
            "content": "Content",
            "read": false,
            "rewards": [],
            "rewardsClaimed": false,
            "title": "Some mail",
          },
        },
      ]
    `)
  })

  it('should have unread badge', () => {
    expect(Mail.unreadBadge('playerId')).toMatchInlineSnapshot(`"§7§7"`)

    Mail.send('playerId', 'Some mail', 'content', new Rewards())
    expect(Mail.unreadBadge('playerId')).toMatchInlineSnapshot(`"§7§8(§c1§8)§7"`)

    Mail.send('playerId', 'Some mail', 'content', new Rewards())
    expect(Mail.unreadBadge('playerId')).toMatchInlineSnapshot(`"§7§8(§c2§8)§7"`)
  })
})
