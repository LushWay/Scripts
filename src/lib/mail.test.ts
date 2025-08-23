import 'lib/extensions/player'

import { Mail } from 'lib/mail'
import { Rewards } from 'lib/utils/rewards'
import { TEST_clearDatabase } from 'test/utils'
import { i18n } from './i18n/text'

describe('mail', () => {
  beforeEach(() => {
    TEST_clearDatabase(Mail.dbGlobal)
    TEST_clearDatabase(Mail.dbPlayers)
  })

  it('should send mail', () => {
    Mail.send('playerId', i18n.join`Some mail`, i18n.join`Content`, new Rewards())

    expect(Mail.getUnreadMessagesCount('playerId')).toBe(1)
  })

  it('should send serializeable mail', () => {
    Mail.send('playerId', i18n.join`Some mail`, i18n.join`Content`, new Rewards())

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
})
