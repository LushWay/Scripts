import { system } from '@minecraft/server'
import { describe, expect, it, vi } from 'vitest'
import { table } from './abstract'
import { migration } from './migrations'

describe('migrations', () => {
  it('should rename database keys after delay', () => {
    const database = table<{ newkey: string }>('testdatabase', () => ({ newkey: '' }))
    ;(database['key1'] as any).oldkey = 'some value'

    migration('test migration', () => {
      Object.entries(database as Record<string, { newkey: string; oldkey?: string }>).forEach(([key, value]) => {
        if (!value) return
        if (value.oldkey) {
          value.newkey = value.oldkey
          delete value.oldkey
        }
      })
    })

    // Value is not migrated, because migration depends on delay
    expect(database['key1']).toMatchInlineSnapshot(`
      {
        "newkey": "",
        "oldkey": "some value",
      }
    `)

    return new Promise<void>(resolve => {
      system.delay(() => {
        expect(database['key1']).toMatchInlineSnapshot(`
          {
            "newkey": "some value",
          }
        `)
        resolve()
      })
    })
  })

  it('should migrate only once', () => {
    return new Promise<void>(resolve => {
      const migrate = vi.fn()

      migration('test migration 2', migrate)
      migration('test migration 2', migrate)

      system.delay(() => {
        expect(migrate).toHaveBeenCalledOnce()
        resolve()
      })
    })
  })
})
