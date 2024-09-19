import { system } from '@minecraft/server'
import { TEST_createPlayer, TEST_onFormOpen } from 'test/utils'
import { describe, expect, it, vi } from 'vitest'
import { ActionForm } from './action'

describe('ActionForm', () => {
  it('should create action form', async () => {
    const cb = vi.fn()
    const player = TEST_createPlayer()
    TEST_onFormOpen(player, 'action', arg => {
      expect(arg).toMatchInlineSnapshot(`
        {
          "body": "body",
          "buttons": [
            {
              "icon": undefined,
              "text": "button",
            },
          ],
          "title": {
            "rawtext": [
              {
                "text": "§c§o§m§m§o§n§r§f",
              },
              {
                "text": "title",
              },
            ],
          },
        }
      `)
      return 0
    })
    new ActionForm('title', 'body')
      .addButton('button', () => {
        console.log('ABC')
        cb()
      })
      .show(player)

    await system.sleep(1)
    expect(cb).toHaveBeenCalledOnce()
  })
})

