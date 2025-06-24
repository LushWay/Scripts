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
})
