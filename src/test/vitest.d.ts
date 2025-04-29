declare global {
  const vi: typeof import('@vitest/spy')

  const it: (typeof import('@vitest/runner'))['it']
  const describe: (typeof import('@vitest/runner'))['describe']
  const beforeAll: (typeof import('@vitest/runner'))['beforeAll']
  const beforeEach: (typeof import('@vitest/runner'))['beforeEach']
  const afterAll: (typeof import('@vitest/runner'))['afterAll']
  const afterEach: (typeof import('@vitest/runner'))['afterEach']

  const expect: import('@vitest/expect').ExpectStatic
  const expectTypeOf: typeof import('expect-type').expectTypeOf
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
