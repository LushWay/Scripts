import { enchantmentPrice } from './price'

describe('price', () => {
  it('should count price', () => {
    let result = ''

    for (let level = 1; level <= 10; level++) {
      result +=
        level +
        ' = ' +
        enchantmentPrice({
          minPrice: 500,
          maxPrice: 100_000,
          offset: 0.3,
          minLevel: 1,
          maxLevel: 10,
          level,
        }) +
        '\n'
    }

    expect(result).toMatchInlineSnapshot(`
      "1 = 500
      2 = 899
      3 = 2775
      4 = 6800
      5 = 13477
      6 = 23230
      7 = 36434
      8 = 53425
      9 = 74517
      10 = 100000
      "
    `)
  })

  it('should count price', () => {
    let result = ''

    for (let level = 1; level <= 3; level++) {
      result +=
        level +
        ' = ' +
        enchantmentPrice({
          minPrice: 1000,
          maxPrice: 10_000,
          offset: 0.18,
          minLevel: 1,
          maxLevel: 3,
          level,
        }) +
        '\n'
    }

    expect(result).toMatchInlineSnapshot(`
      "1 = 1000
      2 = 1437
      3 = 10000
      "
    `)
  })
})
