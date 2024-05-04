import { DatabaseError, DatabaseUtils } from './Abstract.js'

/** Creates proxy-based database with default value */
function table<Value>(name: string, defaultValue: (key: string) => NoInfer<Value>): Record<string, Value>
/** Creates proxy-based database with default value */
function table<Value>(name: string): Record<string, Value | undefined>
/** Creates proxy-based database */
function table<Value>(name: string, defaultValue?: (key: string) => NoInfer<Value>): Record<string, Value | undefined> {
  if (!DatabaseUtils.databaseProvider) throw new DatabaseError('No database provider was specified!')

  return DatabaseUtils.databaseProvider(name, defaultValue)
}

namespace table {
  export const provider = typeof table
}

/**
 * Setups database
 *
 * @param provider - Function that generates table
 */
export function database(provider: typeof table) {
  table.provider = provider
}

const test = table('test')
