import { TEST_createPlayer, TEST_onFormOpen } from 'test/utils'
import { ActionForm } from './action'

describe('ActionForm', () => {
  it('should create action form', async () => {
    const cb = vi.fn()
    const player = TEST_createPlayer()
    TEST_onFormOpen(player, 'action', form => {
      expect(form.dump()).toMatchInlineSnapshot(`
        {
          "body": "body",
          "buttons": [
            "button",
          ],
          "title": "§c§o§m§m§o§n§r§ftitle",
        }
      `)
      return 0
    })
    await new ActionForm('title', 'body').button('button', cb).show(player)

    expect(cb).toHaveBeenCalledOnce()
  })
})
