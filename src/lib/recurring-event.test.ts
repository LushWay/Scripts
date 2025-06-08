import { Temporary } from 'lib//temporary'
import { ms } from 'lib/utils/ms'
import { mockMinecraftTimers, unmockMinecraftTimers } from 'test/timers'
import { DurationalRecurringCallback, DurationalRecurringEvent, RecurringEvent } from './recurring-event'
import later from './utils/later'

beforeAll(() => mockMinecraftTimers())
afterAll(() => unmockMinecraftTimers())

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('RecurringEvent', () => {
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
      new RecurringEvent('midnightCleanup', later.parse.recur().on('00:00:00').time(), () => ({}), fn, {
        runAfterOffline: true,
      })

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
      new RecurringEvent('midnightCleanup', later.parse.recur().on('00:00:00').time(), () => ({}), fn, {
        runAfterOffline: false,
      })

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
    vi.setSystemTime(new Date(2000, 0, 1, 23, 59, 59))

    const event = new RecurringEvent(
      'midnightCleanup 2',
      later.parse.recur().on('00:00:00').time(),
      () => ({ value: [] }),
      fn,
      { runAfterOffline: true },
    )

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn.mock.calls[0]).toMatchInlineSnapshot(`
      [
        {
          "value": [],
        },
        {
          "lastRun": 1999-12-31T21:00:00.000Z,
          "restoreAfterOffline": true,
        },
      ]
    `)

    vi.advanceTimersByTime(1100)
    expect(vi.getMockedSystemTime()).toMatchInlineSnapshot(`2000-01-01T21:00:00.100Z`)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn.mock.calls[1]).toMatchInlineSnapshot(`
      [
        {
          "value": [],
        },
        {
          "lastRun": 2000-01-01T21:00:00.000Z,
          "restoreAfterOffline": false,
        },
      ]
    `)

    event.stop()
  })
})

describe('DurationalRecurringEvent', () => {
  it('should execute durational event and call durational callback', () => {
    vi.setSystemTime(new Date(2000, 0, 0, 10, 29, 59))
    let temp: Temporary | undefined
    const fn = vi.fn<DurationalRecurringCallback>().mockImplementation((_, ctx) => {
      temp = ctx.temp.temporary
    })

    new DurationalRecurringEvent(
      'durational',
      later.parse.recur().on('10:30:00').time(),
      ms.from('min', 1),
      () => ({}),
      fn,
    )

    expect(temp).toBe(undefined)
    expect(fn).toHaveBeenCalledTimes(0)

    vi.advanceTimersByTime(1100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(temp?.cleaned).toBe(false)

    // Expire duration
    vi.advanceTimersByTime(ms.from('min', 1) + 1000)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(temp?.cleaned).toBe(true)
  })

  it('s', () => {
    expect(later.parse.recur().every(5).hour().startingOn(3).schedules).toMatchInlineSnapshot(`
      [
        {
          "h": [
            3,
            8,
            13,
            18,
            23,
          ],
        },
      ]
    `)
  })
})
