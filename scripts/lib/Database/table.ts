import { DatabaseError, DatabaseUtils } from './Abstract.js'

function table<Value>(name: string, defaultValue: (key: string) => NoInfer<Value>): Record<string, Value>
function table<Value>(name: string): Record<string, Value | undefined>

/**
 * Creates proxy-based database
 *
 * @param name - Name of the table
 * @param defaultValue - Function that generates default value
 */
function table<Value>(name: string, defaultValue?: (key: string) => NoInfer<Value>): Record<string, Value | undefined> {
  if (!DatabaseUtils.databaseProvider) throw new DatabaseError('No database provider was specified!')

  return DatabaseUtils.databaseProvider(name, defaultValue)
}

/**
 * Setups database table generator function
 *
 * @param provider - Function that generates table
 */
export function database(provider: typeof table) {
  table.provider = provider
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace table {
  export let provider: typeof table
}
