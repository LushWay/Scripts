import { TicksPerSecond } from '@minecraft/server'
import { fromMsToTicks, fromTicksToMs, ms } from './ms'

describe('ms', () => {
  it('should convert from ticks and back', () => {
    expect(fromTicksToMs(fromMsToTicks(ms.from('min', 1)))).toBe(ms.from('min', 1))
  })

  it('should convert from ticks', () => {
    expect(fromTicksToMs(TicksPerSecond)).toBe(1000)
  })

  it('should convert from ms', () => {
    expect(fromMsToTicks(1000)).toBe(TicksPerSecond)
  })

  it('should convert decimals', () => {
    expect(fromMsToTicks(1001)).toMatchInlineSnapshot(`20`)
  })

  it('should convert decimals from ticks and back', () => {
    expect(fromTicksToMs(fromMsToTicks(ms.from('ms', 1001)))).toMatchInlineSnapshot(`1000`)
  })

  it('should get remaining time', () => {
    expect(ms.remaining(ms.from('day', 1000), { converters: ['day', 'year'] })).toMatchInlineSnapshot(`
      {
        "type": "года",
        "value": "2.778",
      }
    `)
    expect(ms.remaining(ms.from('day', 32) + ms.from('hour', 3), { converters: ['day'], friction: 0 }))
      .toMatchInlineSnapshot(`
        {
          "type": "дня",
          "value": "32",
        }
      `)
  })
})
