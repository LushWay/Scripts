declare global {
  const it: (typeof import('@vitest/runner'))['it']
  const describe: (typeof import('@vitest/runner'))['describe']
  const beforeAll: (typeof import('@vitest/runner'))['beforeAll']
  const beforeEach: (typeof import('@vitest/runner'))['beforeEach']
  const afterAll: (typeof import('@vitest/runner'))['afterAll']
  const afterEach: (typeof import('@vitest/runner'))['afterEach']

  const expect: import('@vitest/expect').ExpectStatic
  const expectTypeOf: typeof import('expect-type').expectTypeOf

  const vi: typeof import('@vitest/spy') & {
    /** Checks if fake timers are enabled. */
    isFakeTimers: () => boolean
    /**
     * This method wraps all further calls to timers until
     * [`vi.useRealTimers()`](https://vitest.dev/api/vi#vi-userealtimers) is called.
     */
    useFakeTimers: (config?: FakeTimerInstallOpts) => VitestUtils
    /**
     * Restores mocked timers to their original implementations. All timers that were scheduled before will be
     * discarded.
     */
    useRealTimers: () => VitestUtils
    /**
     * This method will call every timer that was initiated after
     * [`vi.useFakeTimers`](https://vitest.dev/api/vi#vi-usefaketimers) call. It will not fire any timer that was
     * initiated during its call.
     */
    runOnlyPendingTimers: () => VitestUtils
    /**
     * This method will asynchronously call every timer that was initiated after
     * [`vi.useFakeTimers`](https://vitest.dev/api/vi#vi-usefaketimers) call, even asynchronous ones. It will not fire
     * any timer that was initiated during its call.
     */
    runOnlyPendingTimersAsync: () => Promise<VitestUtils>
    /**
     * This method will invoke every initiated timer until the timer queue is empty. It means that every timer called
     * during `runAllTimers` will be fired. If you have an infinite interval, it will throw after 10,000 tries (can be
     * configured with [`fakeTimers.loopLimit`](https://vitest.dev/config/#faketimers-looplimit)).
     */
    runAllTimers: () => VitestUtils
    /**
     * This method will asynchronously invoke every initiated timer until the timer queue is empty. It means that every
     * timer called during `runAllTimersAsync` will be fired even asynchronous timers. If you have an infinite interval,
     * it will throw after 10 000 tries (can be configured with
     * [`fakeTimers.loopLimit`](https://vitest.dev/config/#faketimers-looplimit)).
     */
    runAllTimersAsync: () => Promise<VitestUtils>
    /**
     * Calls every microtask that was queued by `process.nextTick`. This will also run all microtasks scheduled by
     * themselves.
     */
    runAllTicks: () => VitestUtils
    /**
     * This method will invoke every initiated timer until the specified number of milliseconds is passed or the queue
     * is empty - whatever comes first.
     */
    advanceTimersByTime: (ms: number) => VitestUtils
    /**
     * This method will invoke every initiated timer until the specified number of milliseconds is passed or the queue
     * is empty - whatever comes first. This will include and await asynchronously set timers.
     */
    advanceTimersByTimeAsync: (ms: number) => Promise<VitestUtils>
    /**
     * Will call next available timer. Useful to make assertions between each timer call. You can chain call it to
     * manage timers by yourself.
     */
    advanceTimersToNextTimer: () => VitestUtils
    /**
     * Will call next available timer and wait until it's resolved if it was set asynchronously. Useful to make
     * assertions between each timer call.
     */
    advanceTimersToNextTimerAsync: () => Promise<VitestUtils>
    /**
     * Similar to [`vi.advanceTimersByTime`](https://vitest.dev/api/vi#vi-advancetimersbytime), but will advance timers
     * by the milliseconds needed to execute callbacks currently scheduled with `requestAnimationFrame`.
     */
    advanceTimersToNextFrame: () => VitestUtils
    /** Get the number of waiting timers. */
    getTimerCount: () => number
    /**
     * If fake timers are enabled, this method simulates a user changing the system clock (will affect date related API
     * like `hrtime`, `performance.now` or `new Date()`) - however, it will not fire any timers. If fake timers are not
     * enabled, this method will only mock `Date.*` and `new Date()` calls.
     */
    setSystemTime: (time: number | string | Date) => VitestUtils
    /** Returns mocked current date. If date is not mocked the method will return `null`. */
    getMockedSystemTime: () => Date | null
    /**
     * When using `vi.useFakeTimers`, `Date.now` calls are mocked. If you need to get real time in milliseconds, you can
     * call this function.
     */
    getRealSystemTime: () => number
    /** Removes all timers that are scheduled to run. These timers will never run in the future. */
    clearAllTimers: () => VitestUtils
  }
}

interface InlineSnapshotMatcher<T> {
  <U extends { [P in keyof T]: any }>(properties: Partial<U>, snapshot?: string, message?: string): void
  (message?: string): void
}
declare module '@vitest/expect' {
  interface Assertion<T> {
    toMatchInlineSnapshot: InlineSnapshotMatcher<T>
    /**
     * Checks that an error thrown by a function matches an inline snapshot within the test file. Useful for keeping
     * snapshots close to the test code.
     *
     * @example
     *   const throwError = () => { throw new Error('Error occurred') };
     *   expect(throwError).toThrowErrorMatchingInlineSnapshot(`"Error occurred"`);
     *
     * @param snapshot - Optional inline snapshot string to match.
     * @param message - Optional custom error message.
     */
    toThrowErrorMatchingInlineSnapshot: (snapshot?: string, message?: string) => void
  }
}

export {}
