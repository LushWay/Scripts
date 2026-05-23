import { Table } from './abstract'
import { ProxyDatabase } from './proxy'

describe('ProxyDatabase', () => {
  let database: Table<any, string>
  class Database<Value = unknown, Key extends string = string> extends ProxyDatabase<Value, Key> {
    onLoad(waiter: (value: void) => void): void {}

    loaded = true
  }

  beforeEach(() => {
    database = new Database('id')
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

  it('should delink objects', () => {
    const value = { a: 1 }
    database.set('key', value)
    value.a = 2
    expect(database.get('key')).toMatchInlineSnapshot(`
      {
        "a": 1,
      }
    `)
  })

  it('should delete cache', () => {
    const value = { a: { b: 1 } }

    database.set('key', value)
    const proxy = database.get('key').a

    expect(proxy.a).not.toEqual(value.a)

    database.delete('key')

    database.set('key', value)

    expect(database.get('key').a === proxy).toBeFalsy()
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
    const database = new Database<{ some: { nested: { defaultValue: boolean; assignable?: boolean } } }, string>(
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
