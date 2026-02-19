import { ms } from './ms'
import { msold, ngettext } from './ms-old'

describe('uhh', () => {
  it('works', () => {
    expect(msold.remaining(ms.from('min', 5) - 1000).type).toMatchInlineSnapshot(`"минут"`)
    expect(msold.remaining(ms.from('min', 5)).type).toMatchInlineSnapshot(`"минут"`)
    expect(msold.remaining(ms.from('min', 5) + 1000).type).toMatchInlineSnapshot(`"минут"`)
  })
})
