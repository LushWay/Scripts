import { inaccurateSearch, stringSimilarity } from './search'

describe('innacurate search', () => {
  it('should sort array by search result', () => {
    const array = inaccurateSearch('key', ['keyword', 'lol', 'hhmmmm', 'test case'])

    expect(array[0]?.[0]).toBe('keyword')
    expect(array[1]?.[0]).toBe('lol')
    expect(array[2]?.[0]).toBe('hhmmmm')
    expect(array[3]?.[0]).toBe('test case')
  })

  it('should return 0.0 for empty strings', () => {
    expect(stringSimilarity('', '')).toBe(0.0)
  })
})
