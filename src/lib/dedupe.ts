import { Mutex } from 'async-mutex'

/**
 * Makes it so function can be called only once concurrently. For example, if it was earlier called in the other part of
 * script and not yet finished, and then you call it again, it will wait for previous function to finish and only then
 * will execute. That is for preventing overload. Under hood it uses {@link Mutex} from `async-mutex` to take lock
 *
 * @param fn - Function to dedupe
 * @returns - Deduped function
 */
export function dedupe<T extends (...args: any[]) => Promise<unknown>>(fn: T): T {
  const mutex = new Mutex()
  return ((...args: Parameters<T>) => mutex.runExclusive(() => fn(...args))) as T
}
