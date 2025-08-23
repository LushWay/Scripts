import { world } from '@minecraft/server'
import { mockMinecraftTimers, unmockMinecraftTimers } from 'test/timers'
import { TEST_createPlayer, TEST_emitEvent } from 'test/utils'
import { Temporary } from './temporary'

beforeAll(() => mockMinecraftTimers())
afterAll(() => unmockMinecraftTimers())

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('Temporary', () => {
  it.todo('should unsubscribe events and intervals', () => {
    const player = TEST_createPlayer()
    const intervalFn = vi.fn()
    const eventFn = vi.fn()
    const temp = new Temporary(ctx => {
      ctx.system.runInterval(intervalFn, 'test', 20)
      ctx.world.afterEvents.playerEmote.subscribe(eventFn)
    })

    expect(intervalFn).toBeCalledTimes(0)
    vi.advanceTimersByTime(1200)
    expect(intervalFn).toBeCalledTimes(1)

    expect(eventFn).toBeCalledTimes(0)
    TEST_emitEvent(world.afterEvents.playerEmote, { personaPieceId: '', player })
    expect(eventFn).toBeCalledTimes(1)

    temp.cleanup()
    expect(temp.cleaned).toBe(true)

    expect(intervalFn).toBeCalledTimes(1)
    vi.advanceTimersByTime(1200)
    expect(intervalFn).toBeCalledTimes(1)

    expect(eventFn).toBeCalledTimes(1)
    TEST_emitEvent(world.afterEvents.playerEmote, { personaPieceId: '', player })
    expect(eventFn).toBeCalledTimes(1)
  })
})
