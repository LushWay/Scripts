import { world } from '@minecraft/server'
import { ProxyDatabase } from 'lib/database/proxy'
import { i18n, noI18n } from 'lib/i18n/text'
import { DatabaseDefaultValue, DatabaseError, UnknownTable, configureDatabase } from './abstract'
import { DatabaseUtils } from './utils'

class DynamicPropertyDB<Value = unknown, Key extends string = string> extends ProxyDatabase<Value, Key> {
  static tables: Record<string, UnknownTable> = {}

  constructor(
    protected id: string,
    protected defaultValue?: DatabaseDefaultValue<Value>,
  ) {
    super(id, defaultValue)
    if (id in DynamicPropertyDB.tables) throw new DatabaseError(`Table ${this.id} already initialized!`)
    this.init()
    DynamicPropertyDB.tables[id] = this as UnknownTable
  }

  private init() {
    // Init
    try {
      this.value = new Map(this.restore(LongDynamicProperty.get(this.id) as Record<string, unknown>))
    } catch (error) {
      console.error(new DatabaseError(noI18n`Failed to init table '${this.id}': ${error}`))
    }
  }

  protected override save(databaseData: string) {
    LongDynamicProperty.set(this.id, databaseData)
  }
}

const separator = '|'

export class LongDynamicProperty {
  static get(propertyId: string, defaultValue = '{}', parse = true) {
    const metadata = this.getMetadata(propertyId)
    if (!metadata.value) {
      metadata.value = ''
      for (let i = 0; i < metadata.length; i++) {
        if (!this.getProperty(propertyId, metadata, i)) {
          return console.error(
            `Table ${propertyId}, unable to load entries ${metadata.length - 1 - i} (${i + 1}/${metadata.length})`,
          )
        }
      }
    }

    return parse ? (JSON.parse(metadata.value || defaultValue) as unknown) : metadata.value
  }

  static set(propertyId: string, value: string) {
    const strings = value.match(DatabaseUtils.propertyChunkRegexp)
    if (!strings) throw new DatabaseError('Failed to save db: cannot split')

    world.setDynamicProperty(propertyId, strings.length)
    for (const [i, string] of strings.entries()) {
      world.setDynamicProperty(`${propertyId}${separator}${i}`, string)
    }
  }

  private static getMetadata(propertyId: string) {
    const length = world.getDynamicProperty(propertyId) ?? 0

    if (typeof length === 'string') {
      // Old way load
      return { value: length, length: 1 }
    } else {
      // New way load
      if (typeof length !== 'number') {
        console.error(
          new DatabaseError(`Expected index in type of number, recieved ${typeof length}, table '${propertyId}'`),
        )
        return { length: 1 }
      }

      return { length, value: undefined }
    }
  }

  private static getProperty(
    propertyId: string,
    metadata: ReturnType<(typeof LongDynamicProperty)['getMetadata']>,
    i: number,
  ) {
    const value = world.getDynamicProperty(`${propertyId}${separator}${i}`)
    if (typeof value !== 'string') {
      console.error(
        new DatabaseError(
          noI18n.error`Corrupted database table '${propertyId}', index ${i}, expected string, recieved '${value}'`,
        ),
      )

      return false
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    metadata.value += value
    return true
  }
}

if (!__VITEST__)
  configureDatabase({
    createTable: (name, defaultValue?: import('./abstract').DatabaseDefaultValue<unknown>) =>
      new DynamicPropertyDB<unknown, string>(name, defaultValue),

    tables: DynamicPropertyDB.tables,
    getRawTableData(tableId) {
      return String(LongDynamicProperty.get(tableId, undefined, false))
    },
  })
