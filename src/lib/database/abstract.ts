import { ProxyDatabase } from './proxy'

export type DatabaseDefaultValue<Value> = (key: string) => NoInfer<Value>

export interface Table<Value, Key = string> {
  get(key: Key): Value
  has(key: Key): boolean
  getImmutable(key: Key): Immutable<Value>
  set(key: Key, value: Value): void
  delete(key: Key): boolean
  size: number
  keys(): MapIterator<Key>
  values(): Value[]
  valuesImmutable(): MapIterator<Immutable<Value>>
  entries(): [Key, Value][]
  entriesImmutable(): MapIterator<[Key, Immutable<Value>]>
}

export function table<Value, Key extends string = string>(name: string): Table<Value | undefined, Key>
export function table<Value, Key extends string = string>(
  name: string,
  defaultValue?: DatabaseDefaultValue<Value>,
): Table<Value, Key>

/**
 * Creates proxy-based database that works just like an ordinary ja
 *
 * @param name - Name of the table
 * @param defaultValue - Function that generates default value
 */
export function table<Value, Key extends string = string>(
  name: string,
  defaultValue?: DatabaseDefaultValue<Value>,
): Table<Value | undefined, Key> {
  return provider.createTable(name, defaultValue)
}

export type UnknownTable = Table<unknown>

/** Describes unified database provider */
export interface DatabaseProvider {
  createTable: typeof table
  tables: Record<string, UnknownTable>
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

/** Database table that doesn't saves values anywhere except memory */
export class MemoryTable<Value, Key extends string = string> extends ProxyDatabase<Value, Key> {
  static id = 0

  constructor(tableData?: Partial<Record<Key, Value>>, defaultValue?: DatabaseDefaultValue<Value>) {
    MemoryTable.id++
    super(MemoryTable.id.toString(), defaultValue)
    if (tableData) {
      this.value = new Map(Object.entries(tableData)) as Map<Key, Value>
    }
  }
}

if (__TEST__) {
  class TestDatabase<Value, Key extends string> extends ProxyDatabase<Value, Key> {}

  configureDatabase({
    tables: TestDatabase.tables,

    createTable: (name, defaultValue?: DatabaseDefaultValue<unknown>) =>
      new TestDatabase<unknown, string>(name, defaultValue),

    getRawTableData: tableId =>
      JSON.stringify((TestDatabase.tables[tableId] as TestDatabase<unknown, string>).getRawValue()),
  })
}

export class DatabaseError extends Error {}
