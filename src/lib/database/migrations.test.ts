import { system } from '@minecraft/server'
import { Table, table } from './abstract'
import { migration } from './migrations'

describe('migrations', () => {
  it('should rename database keys after delay', () => {
    const database = table<{ newkey: string }>('testdatabase', () => ({ newkey: '' }))
    ;(database.get('key1') as { newkey: string; oldkey: string }).oldkey = 'some value'

    migration('test migration', () => {
      for (const [, value] of (database as Table<{ newkey: string; oldkey?: string }, string>).entries()) {
        if (!value) return
        if (value.oldkey) {
          value.newkey = value.oldkey
          delete value.oldkey
        }
      }
    })

    // Value is not migrated, because migration depends on delay
    expect(database.get('key1')).toEqual({ newkey: '', oldkey: 'some value' })

    return new Promise<void>(resolve => {
      system.delay(() => {
        expect(database.get('key1')).toEqual({ newkey: 'some value' })
        resolve()
      })
    })
  })

  it('should migrate only once', () => {
    return new Promise<void>(resolve => {
      const migrate = vi.fn()

      migration('test migration 2', migrate)

      system.delay(() => {
        expect(migrate).toHaveBeenCalledOnce()

        migration('test migration 2', migrate)
        expect(migrate).toHaveBeenCalledOnce()

        resolve()
      })
    })
  })

  it('should migrate only once even when multiple migrations are triggered', () => {
    return new Promise<void>(resolve => {
      const migrate = vi.fn()

      migration('test migration 3', migrate)
      migration('test migration 3', migrate)

      system.delay(() => {
        expect(migrate).toHaveBeenCalledOnce()
        migration('test migration 3', migrate)

        system.delay(() => {
          expect(migrate).toHaveBeenCalledOnce()
          resolve()
        })
      })
    })
  })
})
