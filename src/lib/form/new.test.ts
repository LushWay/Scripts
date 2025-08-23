import { test } from 'test/utils'
import { form } from './new'

describe('NewForm', () => {
  it('should construct simple form', async () => {
    const player = test.createPlayer()
    const callback = vi.fn()
    const form1 = form(f => f.button('text', callback))

    await test.form(
      player,
      () => form1.show(player),
      test.form.action(ctx => {
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
      }),
    )

    expect(callback).toHaveBeenCalledOnce()
  })

  it('should should call other form', async () => {
    const player = test.createPlayer()
    const callback = vi.fn()
    const form1 = form(f => f.button('text', form2))
    const form2 = form(f => f.button('text2', callback))

    await test.form(
      player,
      () => form1.show(player),
      test.form.action(ctx => ctx.clickOnButtonWhichText.equals('text')),
      test.form.action(ctx => ctx.clickOnButtonWhichText.equals('text2')),
    )

    expect(callback).toHaveBeenCalledOnce()
  })

  it('should should call other form with texture', { timeout: 300 }, async () => {
    const player = test.createPlayer()
    const callback = vi.fn()
    const form1 = form(f => f.button(form2, 'textures/glass.png'))
    const form2 = form(f => f.title('form2 title').button('text2', callback))

    await test.form(
      player,
      () => form1.show(player),
      test.form.action(ctx => ctx.clickOnButtonWhichText.equals('form2 title')),
      test.form.action(ctx => ctx.clickOnButtonWhichText.equals('text2')),
    )

    expect(callback).toHaveBeenCalledOnce()
  })
})
