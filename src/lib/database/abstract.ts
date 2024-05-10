import { ProxyDatabase } from './proxy'
import { DatabaseError } from './utils'

export type DatabaseDefaultValue<Value> = (key: string) => NoInfer<Value>

export function table<Value>(name: string, defaultValue: DatabaseDefaultValue<Value>): Record<string, Value>
export function table<Value>(name: string): Record<string, Value | undefined>

/**
 * Creates proxy-based database that works just like an ordinary ja
 *
 * @param name - Name of the table
 * @param defaultValue - Function that generates default value
 */
export function table<Value>(
  name: string,
  defaultValue?: DatabaseDefaultValue<Value>,
): Record<string, Value | undefined> {
  if (!provider) throw new DatabaseError('No database provider was specified!')

  return provider.createTable(name, defaultValue as DatabaseDefaultValue<Value>)
}

export type DatabaseTable = Record<string, unknown>

/** Describes unified database provider */
type DatabaseProvider = {
  createTable: typeof table
  tables: Record<string, DatabaseTable>
  getRawTableData: (tableId: string) => string
}

/** Stores database provider */
let provider: DatabaseProvider

/**
 * Setups database table generator function
 *
 * @param config - Function that generates table
 */
export function configureDatabase(config: DatabaseProvider) {
  provider = config
}

/** Returns current database provider */
export function getProvider() {
  return provider
}

if (__TEST__) {
  class TestDatabase<Key extends string, Value> extends ProxyDatabase<Key, Value> {
    static tables = {} as Record<string, DatabaseTable>
    constructor(
      private name: string,
      defaultValue?: DatabaseDefaultValue<Partial<Value>>,
    ) {
      super()
      TestDatabase.tables[name] = this.proxy()
      if (defaultValue) this.defaultValue = defaultValue
    }
  }

  configureDatabase({
    createTable: (name, defaultValue?: DatabaseDefaultValue<Partial<any>>) =>
      new TestDatabase<string, any>(name, defaultValue).proxy(),
    tables: TestDatabase.tables,
    getRawTableData(tableId) {
      return ''
    },
  })
}
