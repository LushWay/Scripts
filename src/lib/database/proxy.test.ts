import { beforeEach, describe, expect, it } from 'vitest'
import { ProxyDatabase } from './proxy'

describe('ProxyDatabase', () => {
  let database: Record<string, any>
  beforeEach(() => {
    database = new ProxyDatabase('id').proxy()
  })

  it('should save strings', () => {
    database.value = 'string'
    expect(database.value).toBe('string')
  })

  it('should save numbers', () => {
    database.value = 2
    expect(database.value).toBe(2)
  })

  it('should save nested objects', () => {
    database.value = { some: { very: { very: { nested: { object: true } } } } }
    expect(database.value).toMatchInlineSnapshot(`
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
    database.array = [1, 2, 4, 5]
    expect(database.array).toMatchInlineSnapshot(`
      [
        1,
        2,
        4,
        5,
      ]
    `)
  })

  it('should save array items with the same ref', () => {
    database.array = [1, 2, { object: true }]
    expect(database.array[2]).toBe(database.array[2])
  })

  it('should support default value', () => {
    const database = new ProxyDatabase<string, { some: { nested: { defaultValue: boolean; assignable?: boolean } } }>(
      'default',
      () => ({
        some: {
          nested: {
            defaultValue: true,
          },
        },
      }),
    ).proxy()

    expect(database['default value key']).toMatchInlineSnapshot(`
      {
        "some": {
          "nested": {
            "defaultValue": true,
          },
        },
      }
    `)

    database['key'].some.nested.assignable = false
    expect(database['key'].some.nested.assignable).toBe(false)
    expect(database['other key'].some.nested.assignable).toBe(undefined)
  })
})
