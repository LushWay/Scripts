import { TEST_createPlayer, TEST_onFormOpen } from 'test/utils'
import { form } from './new'

describe('NewForm', () => {
  it('should construct simple form', async () => {
    const player = TEST_createPlayer()
    const callback = vi.fn()
    const f = form(f => f.button('text', callback))
    TEST_onFormOpen(player, 'action', ctx => {
      expect(ctx.dump()).toMatchInlineSnapshot(`
        {
          "body": "",
          "buttons": [
            "text",
          ],
          "title": "§c§o§m§m§o§n§r§fForm",
        }
      `)
      return ctx.clickOnButtonWhichText.equals('text')
    })
    await f.show(player)
    expect(callback).toHaveBeenCalledOnce()
  })

  it('should should call other form', async () => {
    const player = TEST_createPlayer()
    const callback = vi.fn()
    const f = form(f => f.button('text', f2))
    const f2 = form(f => f.button('text2', callback))

    TEST_onFormOpen(player, 'action', ctx => {
      TEST_onFormOpen(player, 'action', ctx => ctx.clickOnButtonWhichText.equals('text2'))
      return ctx.clickOnButtonWhichText.equals('text')
    })
    await f.show(player)

    expect(callback).toHaveBeenCalledOnce()
  })
})
