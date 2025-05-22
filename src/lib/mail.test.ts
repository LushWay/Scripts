import 'lib/extensions/player'

import { Mail } from 'lib/mail'
import { Rewards } from 'lib/shop/rewards'
import { UnknownTable } from './database/abstract'

describe('mail', () => {
  beforeEach(() => {
    function clear(database: UnknownTable) {
      for (const key of database.keys()) database.delete(key)
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
    expect(Mail.unreadBadge('playerId')).toMatchInlineSnapshot(`"§7§7(§c1§7)§7"`)

    Mail.send('playerId', 'Some mail', 'content', new Rewards())
    expect(Mail.unreadBadge('playerId')).toMatchInlineSnapshot(`"§7§7(§c2§7)§7"`)
  })
})
