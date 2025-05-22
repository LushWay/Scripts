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

describe('ProxyDatabase.setDefaults', () => {
  it('should return sourceObject when it is an array', () => {
    const sourceArray = [1, 2, 3]
    const defaultObject = { a: 1 }
    const result = ProxyDatabase.setDefaults(sourceArray as unknown as Record<string, unknown>, defaultObject)
    expect(result).toEqual(sourceArray)
  })

  it('should return defaultObject when it is an array', () => {
    const sourceObject = { a: 1 }
    const defaultArray = [1, 2, 3]
    const result = ProxyDatabase.setDefaults(sourceObject, defaultArray as unknown as Record<string, unknown>)
    expect(result).toEqual(defaultArray)
  })

  it('should not override array', () => {
    const sourceObject = { owners: ['120341'] }
    const defaultObject = { owners: [] }
    const result = ProxyDatabase.setDefaults(sourceObject, defaultObject)
    expect(result).toEqual(sourceObject)
  })

  it('should merge objects with nested structures', () => {
    const sourceObject = { a: { b: 1 }, c: 3 }
    const defaultObject = { a: { b: 2, d: 4 }, e: 5 }
    const result = ProxyDatabase.setDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: { b: 1, d: 4 }, c: 3, e: 5 })
  })

  it('should handle defaultObject with null or undefined properties', () => {
    const sourceObject = { a: 1, b: 2 }
    const defaultObject = { a: null, b: undefined, c: 3 }
    const result = ProxyDatabase.setDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('should handle sourceObject with null or undefined properties', () => {
    const sourceObject = { a: null, b: undefined, c: 3 }
    const defaultObject = { a: 1, b: 2, d: 4 }
    const result = ProxyDatabase.setDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: null, b: 2, c: 3, d: 4 })
  })

  it('should merge objects with primitive values and non-conflicting keys', () => {
    const sourceObject = { a: 1, b: 2 }
    const defaultObject = { c: 3, d: 4 }
    const result = ProxyDatabase.setDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
  })

  it('should not modify original objects', () => {
    const sourceObject = { a: 1, b: 2 }
    const defaultObject = { b: 3, c: 4 }
    const sourceCopy = { ...sourceObject }
    const defaultCopy = { ...defaultObject }
    ProxyDatabase.setDefaults(sourceObject, defaultObject)
    expect(sourceObject).toEqual(sourceCopy)
    expect(defaultObject).toEqual(defaultCopy)
  })
})

describe('ProxyDatabase.removeDefaults', () => {
  it('should return sourceObject when it is an array', () => {
    const sourceArray = [1, 2, 3]
    const defaultObject = { a: 1 }
    const result = ProxyDatabase.removeDefaults(sourceArray as unknown as Record<string, unknown>, defaultObject)
    expect(result).toEqual(sourceArray)
  })

  it('should remove properties that match default values', () => {
    const sourceObject = { a: 1, b: 2, c: 3 }
    const defaultObject = { a: 1, b: 2, d: 4 }
    const result = ProxyDatabase.removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ c: 3 })
  })

  it('should handle nested objects', () => {
    const sourceObject = { a: { b: 1, c: 2 }, d: 3 }
    const defaultObject = { a: { b: 1, c: 3 }, d: 4 }
    const result = ProxyDatabase.removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: { c: 2 }, d: 3 })
  })

  it('should handle arrays within objects', () => {
    const sourceObject = { a: [1, 2, 3], b: 2 }
    const defaultObject = { a: [1, 2, 3], b: 2 }
    const result = ProxyDatabase.removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({})
  })

  it('should handle properties with null or undefined values', () => {
    const sourceObject = { a: null, b: undefined, c: 3 }
    const defaultObject = { a: null, b: 2, d: 4 }
    const result = ProxyDatabase.removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ b: undefined, c: 3 })
  })

  it('should not delete not empty arrays', () => {
    const sourceObject = { owners: ['120341'] }
    const defaultObject = { owners: [] }
    const result = ProxyDatabase.removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual(sourceObject)
  })

  it('should not remove properties that do not match default values', () => {
    const sourceObject = { a: 1, b: 3, c: 3 }
    const defaultObject = { a: 1, b: 2, d: 4 }
    const result = ProxyDatabase.removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ b: 3, c: 3 })
  })

  it('should handle empty sourceObject and defaultObject', () => {
    const sourceObject = {}
    const defaultObject = {}
    const result = ProxyDatabase.removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({})
  })

  it('should handle non-object sourceObject', () => {
    const sourceObject = 123
    const defaultObject = { a: 1 }
    const result = ProxyDatabase.removeDefaults(sourceObject as unknown as Record<string, unknown>, defaultObject)
    expect(result).toEqual({})
  })

  it('should not modify original objects', () => {
    const sourceObject = { a: 1, b: 2 }
    const defaultObject = { b: 2, c: 3 }
    const sourceCopy = { ...sourceObject }
    const defaultCopy = { ...defaultObject }
    ProxyDatabase.removeDefaults(sourceObject, defaultObject)
    expect(sourceObject).toEqual(sourceCopy)
    expect(defaultObject).toEqual(defaultCopy)
  })
})
