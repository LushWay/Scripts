import { describe, expect, it } from 'vitest'
import { Mail } from './mail'
import { Rewards } from './rewards'

describe('mail', () => {
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
})
