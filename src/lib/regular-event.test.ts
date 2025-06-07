import { RegularEvent } from './regular-event'

const noop = () => {}

describe('RegularEvent', () => {
  it('should fire', () => {
    expect(new RegularEvent(10, 20, false, noop).shouldFire(10, 19)).toBe(false)
    expect(new RegularEvent(10, 20, false, noop).shouldFire(10, 20)).toBe(true)
    expect(new RegularEvent(10, 20, false, noop).shouldFire(10, 21)).toBe(true)
    expect(new RegularEvent(10, 20, false, noop).shouldFire(10, 22)).toBe(true)
    expect(new RegularEvent(10, 20, false, noop).shouldFire(10, 23)).toBe(true)
    expect(new RegularEvent(10, 20, false, noop).shouldFire(10, 24)).toBe(false)

    expect(new RegularEvent(10, 20, true, noop).shouldFire(10, 26)).toBe(true)
  })

  it('should create firedOn', () => {
    expect(RegularEvent.runDate(new Date(0))).toMatchInlineSnapshot(`"1970-01-01"`)
    expect(RegularEvent.runDate(new Date(1000000000000))).toMatchInlineSnapshot(`"2001-09-09"`)
  })
})
