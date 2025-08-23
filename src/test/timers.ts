import { system } from '@minecraft/server'
import { fromTicksToMs } from 'lib/utils/ms'

declare function setTimeout(fn: VoidFunction, delay: number): number
declare function setInterval(fn: VoidFunction, delay: number): number
declare function clearTimeout(handle: number): number
declare function clearInterval(handle: number): number

let cleanup: VoidFunction | undefined

export function mockMinecraftTimers() {
  if (cleanup) return

  const cleanups = new Map<number, VoidFunction>()
  let handle = 0
  function acquireHandle(cleanup: VoidFunction) {
    handle++
    cleanups.set(handle, cleanup)
    return handle
  }

  const mocks = [
    vi.spyOn(system, 'runTimeout').mockImplementation((r, _, tickDelay = 0) => {
      const id = setTimeout(r, fromTicksToMs(tickDelay))
      return acquireHandle(() => clearTimeout(id))
    }),

    vi.spyOn(system, 'runInterval').mockImplementation((r, _, tickDelay = 0) => {
      const s = setInterval(r, fromTicksToMs(tickDelay))
      return acquireHandle(() => clearInterval(s))
    }),
    vi.spyOn(system, 'clearRun').mockImplementation(r => {
      cleanups.get(r)?.()
      cleanups.delete(r)
    }),
  ]

  cleanup = () => {
    for (const mock of mocks) mock.mockReset()
  }
}

export function unmockMinecraftTimers() {
  cleanup?.()
}
