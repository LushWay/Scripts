import { world } from '@minecraft/server'
import { ProxyDatabase } from 'lib/database/proxy'
import { util } from '../util'
import { DatabaseDefaultValue, DatabaseError, DatabaseTable, configureDatabase } from './abstract'
import { DatabaseUtils } from './utils'

class DynamicPropertyDB<Key extends string = string, Value = undefined> extends ProxyDatabase<Key, Value> {
  static tables: Record<string, DatabaseTable> = {}

  private static separator = '|'

  constructor(
    protected id: string,
    protected defaultValue?: DatabaseDefaultValue<Value>,
  ) {
    super(id, defaultValue)
    if (id in DynamicPropertyDB.tables) throw new DatabaseError(`Table ${this.id} already initialized!`)
    DynamicPropertyDB.tables[id] = this.proxy()
    this.init()
  }

  private init() {
    // Init
    try {
      let value = ''
      let length = world.getDynamicProperty(this.id) ?? 0
      if (typeof length === 'string') {
        // Old way load
        value = length
        length = 1
      } else {
        // New way load
        if (typeof length !== 'number') {
          console.error(
            new DatabaseError(`Expected index in type of number, recieved ${typeof value}, table '${this.id}'`),
          )

          length = 1
        }

        for (let i = 0; i < length; i++) {
          const prop = world.getDynamicProperty(`${this.id}${DynamicPropertyDB.separator}${i}`)
          if (typeof prop !== 'string') {
            console.error(
              new DatabaseError(
                `Corrupted database table '${this.id}', index ${i}, expected string, recieved '${util.inspect(prop)}'`,
              ),
            )
            console.error('Loaded part of database:', value)
            return
          }
          value += prop
        }
      }

      this.value = Object.fromEntries(
        Object.entries(JSON.parse(value || '{}') as Record<string, unknown>).map(([key, value]) => {
          const defaultv = typeof key !== 'symbol' && this.defaultValue?.(key)
          return [
            // Add default value
            key,
            typeof value === 'object' && value !== null && typeof defaultv === 'object' && defaultv !== null
              ? ProxyDatabase.setDefaults(value as JsonObject, defaultv as JsonObject)
              : value ?? defaultv,
          ]
        }),
      )
    } catch (error) {
      console.error(new DatabaseError(`Failed to init table '${this.id}': ${util.error(error as Error)}`))
    }
  }

  protected override save(databaseData: string) {
    const strings = databaseData.match(DatabaseUtils.propertyChunkRegexp)
    if (!strings) throw new DatabaseError('Failed to save db: cannot split')
    world.setDynamicProperty(this.id, strings.length)
    for (const [i, string] of strings.entries()) {
      world.setDynamicProperty(`${this.id}${DynamicPropertyDB.separator}${i}`, string)
    }
  }
}

configureDatabase({
  createTable: (name, defaultValue?: import('./abstract').DatabaseDefaultValue<unknown>) =>
    new DynamicPropertyDB<string, unknown>(name, defaultValue).proxy(),
  tables: DynamicPropertyDB.tables,
  getRawTableData(tableId) {
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    return world.getDynamicProperty(tableId) + ''
  },
})
