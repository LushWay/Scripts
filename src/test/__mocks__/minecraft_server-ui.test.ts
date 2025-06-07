import { form } from 'lib/form/new'
import { TEST_createPlayer, TEST_onFormOpen } from 'test/utils'

describe('Form', () => {
  it('should open form', async () => {
    const player = TEST_createPlayer()
    const b1 = vi.fn()
    const b2 = vi.fn()

    TEST_onFormOpen(player, 'action', form => {
      expect(form.clickOnButtonWhichText.dump()).toMatchInlineSnapshot(`
        [
          "button1",
          "button2",
        ]
      `)

      return form.clickOnButtonWhichText.equalsUncolored('button1')
    })

    await form(f => {
      f.title('title')
      f.body('body')
      f.button('button1', b1)
      f.button('button2', b2)
    }).show(player)

    expect(b1).toHaveBeenCalledOnce()
  })

  it('should throw when unable to find button', async () => {
    const player = TEST_createPlayer()
    const b1 = vi.fn()
    const b2 = vi.fn()

    TEST_onFormOpen(player, 'action', form => {
      return form.clickOnButtonWhichText.equalsUncolored('buton1')
    })

    await expect(async () => {
      await form(f => {
        f.title('title')
        f.body('body')
        f.button('button1', b1)
        f.button('button2', b2)
      }).show(player)
    }).rejects.toMatchInlineSnapshot(
      `[Error: Unable to find button with text 'buton1', closest is 'button1' 87%, 'button2' 62%]`,
    )

    expect(b1).toHaveBeenCalledTimes(0)
  })
})
