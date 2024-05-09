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

  return provider(name, defaultValue as DatabaseDefaultValue<Value>)
}

let provider: typeof table

/**
 * Setups database table generator function
 *
 * @param provider - Function that generates table
 */
export function configureDatabase(provider: typeof table) {
  provider = provider as typeof table
}
