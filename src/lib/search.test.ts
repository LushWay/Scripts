import { describe, expect, it } from 'vitest'
import { inaccurateSearch } from './search'

describe('innacurate search', () => {
  it('should sort array by search result', () => {
    const array = inaccurateSearch('key', ['keyword', 'lol', 'hhmmmm', 'test case'])

    expect(array[0][0]).toBe('keyword')
    expect(array[1][0]).toBe('lol')
    expect(array[2][0]).toBe('hhmmmm')
    expect(array[3][0]).toBe('test case')
  })
})
