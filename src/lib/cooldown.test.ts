import { Cooldown } from 'lib/cooldown'

describe('test cooldown', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not work the milisecond after', () => {
    vi.useFakeTimers()

    const cd = new Cooldown(1000, true, {})

    expect(cd.isExpired('test')).toMatchInlineSnapshot(`true`)
    expect(cd.isExpired('test')).toMatchInlineSnapshot(`false`)
  })

  it('should not work the second after', () => {
    const cd = new Cooldown(1000, true, {})

    expect(cd.isExpired('test')).toMatchInlineSnapshot(`true`)
    expect(cd.isExpired('test')).toMatchInlineSnapshot(`false`)
  })
})
