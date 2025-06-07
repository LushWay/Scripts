import { system } from '@minecraft/server'
import { fromTicksToMs, ms } from 'lib/utils/ms'
import { RecurringEvent } from './recurring-event'
import later from './utils/later'

declare function setTimeout(fn: VoidFunction, delay: number): number
declare function clearTimeout(handle: number): number

describe('RecurringEvent', () => {
  beforeAll(() => {
    vi.spyOn(system, 'runTimeout').mockImplementation((r, _, tickDelay = 0) => setTimeout(r, fromTicksToMs(tickDelay)))
    vi.spyOn(system, 'clearRun').mockImplementation(r => clearTimeout(r))
  })

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('should execute recurring event at specified time', () => {
    const fn = vi.fn()
    vi.setSystemTime(new Date(2000, 0, 0, 10, 29, 59))
    new RecurringEvent('general', later.parse.recur().on('10:30:00').time(), () => ({}), fn)

    expect(fn).toHaveBeenCalledTimes(0)
    vi.advanceTimersByTime(1100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should execute recurring event at specified time after server was offline', () => {
    const fn = vi.fn()
    vi.setSystemTime(new Date(2000, 0, 0, 23, 59, 59))
    const create = () =>
      new RecurringEvent('midnightCleanup', later.parse.recur().on('00:00:00').time(), () => ({}), fn, true)

    let event = create()

    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1100)
    expect(fn).toHaveBeenCalledTimes(2)

    // Simulate server shutdown
    event.stop()
    vi.advanceTimersByTime(ms.from('day', 1))

    event = create()
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should execute recurring event at specified time after server was offline', () => {
    const fn = vi.fn()
    vi.setSystemTime(new Date(2000, 0, 0, 23, 59, 59))
    const create = () =>
      new RecurringEvent('midnightCleanup', later.parse.recur().on('00:00:00').time(), () => ({}), fn, false)

    const event = create()

    expect(fn).toHaveBeenCalledTimes(0)
    vi.advanceTimersByTime(1100)
    expect(fn).toHaveBeenCalledTimes(1)

    // Simulate server shutdown
    event.stop()
    vi.advanceTimersByTime(ms.from('day', 1))

    create()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should execute recurring event with storage', () => {
    const fn = vi.fn()
    vi.setSystemTime(new Date(2000, 0, 0, 23, 59, 59))

    const event = new RecurringEvent(
      'midnightCleanup 2',
      later.parse.recur().on('00:00:00').time(),
      () => ({ value: [] }),
      fn,
      true,
    )

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn.mock.calls[0]).toMatchInlineSnapshot(`
      [
        {
          "value": [],
        },
        true,
      ]
    `)

    vi.advanceTimersByTime(1100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn.mock.calls[1]).toMatchInlineSnapshot(`
      [
        {
          "value": [],
        },
        false,
      ]
    `)

    event.stop()
  })
})
