import { Table } from './abstract'
import { ProxyDatabase } from './proxy'

describe('ProxyDatabase', () => {
  let database: Table<any, string>
  beforeEach(() => {
    database = new ProxyDatabase('id')
  })

  it('should save strings', () => {
    database.set('value', 'string')
    expect(database.get('value')).toBe('string')
  })

  it('should save numbers', () => {
    database.set('value', 2)
    expect(database.get('value')).toBe(2)
  })

  it('should save nested objects', () => {
    database.set('value', { some: { very: { very: { nested: { object: true } } } } })
    expect(database.get('value')).toMatchInlineSnapshot(`
      {
        "some": {
          "very": {
            "very": {
              "nested": {
                "object": true,
              },
            },
          },
        },
      }
    `)
  })

  it('should save arrays', () => {
    database.set('array', [1, 2, 4, 5])
    expect(database.get('array')).toMatchInlineSnapshot(`
      [
        1,
        2,
        4,
        5,
      ]
    `)
  })

  it('should save array items with the same ref', () => {
    database.set('array', [1, 2, { object: true }])
    expect(database.get('array')[2]).toBe(database.get('array')[2])
  })

  it('should support default value', () => {
    const database = new ProxyDatabase<{ some: { nested: { defaultValue: boolean; assignable?: boolean } } }, string>(
      'default',
      () => ({ some: { nested: { defaultValue: true } } }),
    )

    expect(database.get('default value key')).toMatchInlineSnapshot(`
      {
        "some": {
          "nested": {
            "defaultValue": true,
          },
        },
      }
    `)

    database.get('key').some.nested.assignable = false
    expect(database.get('key').some.nested.assignable).toBe(false)
    expect(database.get('other key').some.nested.assignable).toBe(undefined)
  })
})
