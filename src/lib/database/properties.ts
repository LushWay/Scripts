import { system, world } from '@minecraft/server'
import { ProxyDatabase } from 'lib/database/proxy'
import { util } from '../util'
import { DatabaseTable, configureDatabase } from './abstract'
import { DatabaseError, DatabaseUtils } from './utils'

class DynamicPropertyDB<Key extends string = string, Value = undefined> extends ProxyDatabase<Key, Value> {
  static delay: (fn: VoidFunction) => void = fn =>
    system.delay(() => {
      fn()
      console.log('delay called')
    })

  static tables: Record<string, DatabaseTable> = {}

  static separator = '|'

  constructor(
    public tableId: string,
    options: {
      type?: Record<Key, Value>
      defaultValue?: (p: string) => Partial<Value>
      delayedInit?: boolean
    } = {},
  ) {
    super()

    if (tableId in DynamicPropertyDB.tables) throw new DatabaseError(`Table ${this.tableId} already initialized!`)
    if (options.defaultValue) this.defaultValue = options.defaultValue

    DynamicPropertyDB.tables[tableId] = this.proxy()
    if (!options.delayedInit) this.init()
  }

  init() {
    // Init
    try {
      let value = ''
      let length = world.getDynamicProperty(this.tableId) ?? 0
      if (typeof length === 'string') {
        // Old way load
        value = length
        length = 1
      } else {
        // New way load
        if (typeof length !== 'number') {
          util.error(
            new DatabaseError(`Expected index in type of number, recieved ${typeof value}, table '${this.tableId}'`),
          )

          length = 1
        }

        for (let i = 0; i < length; i++) {
          const prop = world.getDynamicProperty(this.tableId + DynamicPropertyDB.separator + i)
          if (typeof prop !== 'string') {
            util.error(
              new DatabaseError(
                `Corrupted database table '${this.tableId}', index ${i}, expected string, recieved '${util.inspect(
                  prop,
                )}'`,
              ),
            )
            console.error('Loaded part of database:', value)
            return
          }
          value += prop
        }
      }

      this.value = Object.fromEntries(
        Object.entries(JSON.parse(value || '{}')).map(([key, value]) => {
          const defaultv = typeof key !== 'symbol' && this.defaultValue?.(key)
          return [
            // Add default value
            key,
            typeof value === 'object' && value !== null && typeof defaultv === 'object' && defaultv !== null
              ? DatabaseUtils.setDefaults(value, defaultv)
              : value ?? defaultv,
          ]
        }),
      )
    } catch (error) {
      util.error(new DatabaseError(`Failed to init table '${this.tableId}': ${util.error(error, { parseOnly: true })}`))
    }
  }

  protected override save(databaseData: string) {
    const strings = databaseData.match(DatabaseUtils.propertyChunkRegexp)
    if (!strings) throw new DatabaseError('Failed to save db: cannot split')
    world.setDynamicProperty(this.tableId, strings.length)
    for (const [i, string] of strings.entries()) {
      world.setDynamicProperty(this.tableId + DynamicPropertyDB.separator + i, string)
    }
  }
}

configureDatabase({
  createTable: (name, defaultValue?: import('./abstract').DatabaseDefaultValue<Partial<any>>) =>
    new DynamicPropertyDB<string, any>(name, { defaultValue }).proxy(),
  tables: DynamicPropertyDB.tables,
  getRawTableData(tableId) {
    return world.getDynamicProperty(tableId) + ''
  },
})
