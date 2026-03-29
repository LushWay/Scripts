import { wordWrap, wrap } from './util'

describe('wordwrap', () => {
  it('should wrap', () => {
    expect(wrap('Some really long string', 5)).toMatchInlineSnapshot(`
      [
        "Some ",
        "reall",
        "y lon",
        "g str",
        "ing",
      ]
    `)

    expect(wordWrap('Some really long string', 5)).toMatchInlineSnapshot(`
      [
        "Some really",
        "long string",
      ]
    `)
  })
})

