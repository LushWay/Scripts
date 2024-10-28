import { dedupe } from './dedupe'

describe('dedupe', () => {
  it('should execute the function only once when called multiple times concurrently', async () => {
    let lock = 0
    const mockFn = vi.fn(async () => {
      lock++
      // @ts-ignore
      await new Promise(r => setTimeout(r, 2))
      lock--
      expect(lock).toBe(0)
    })
    const dedupedFn = dedupe(mockFn)

    const promise1 = dedupedFn()
    const promise2 = dedupedFn()
    const promise3 = dedupedFn()

    await Promise.all([promise1, promise2, promise3])

    expect(mockFn).toHaveBeenCalledTimes(3)
    expect(mockFn).toHaveBeenCalledWith()
  })

  it('should execute the function with the correct arguments', async () => {
    const mockFn = vi.fn((arg1: string, arg2: number) => Promise.resolve(`${arg1}-${arg2}`))
    const dedupedFn = dedupe(mockFn)

    const promise1 = dedupedFn('test1', 1)
    const promise2 = dedupedFn('test2', 2)
    const promise3 = dedupedFn('test3', 3)

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

    expect(mockFn).toHaveBeenCalledTimes(3)
    expect(mockFn).toHaveBeenCalledWith('test1', 1)
    expect(result1).toBe('test1-1')
    expect(result2).toBe('test2-2')
    expect(result3).toBe('test3-3')
  })

  it('should return the correct result', async () => {
    const mockFn = vi.fn(() => Promise.resolve('test'))
    const dedupedFn = dedupe(mockFn)

    const result = await dedupedFn()

    expect(result).toBe('test')
  })

  it('should handle errors correctly', async () => {
    const mockFn = vi.fn(() => Promise.reject(new Error('test error')))
    const dedupedFn = dedupe(mockFn)

    const promise1 = dedupedFn()
    const promise2 = dedupedFn()
    const promise3 = dedupedFn()

    await expect(Promise.all([promise1, promise2, promise3])).rejects.toThrowError('test error')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })
})
