import { system, world } from '@minecraft/server'
import { util } from '../util'
import { configureDatabase } from './abstract'
import { DatabaseError, DatabaseUtils } from './utils'

const IS_PROXIED = Symbol('is_proxied')
const PROXY_TARGET = Symbol('proxy_target')

export class DynamicPropertyDB<Key extends string = string, Value = undefined> {
  /**
   * Usefull when a lot of data is being read from object, taken from database.
   *
   * **Caution**: Mutating unproxied value can cause data leaks. Consider using immutableUnproxy instead.
   */
  static unproxy<T extends object>(value: T): T {
    if (typeof value === 'object' && value !== null && PROXY_TARGET in value) return value[PROXY_TARGET] as T
    return value
  }

  static immutableUnproxy<T extends object>(value: T): Immutable<T> {
    return this.unproxy(value) as Immutable<T>
  }

  static tables: Record<string, DynamicPropertyDB<any, any>> = {}

  static separator = '|'

  private value: Record<any, any> = {}

  private defaultValue: (p: string) => Partial<Value>

  /** @type {string} */
  tableId: string

  constructor(
    tableId: string,
    options: {
      type?: Record<Key, Value>
      defaultValue?: (p: string) => Partial<Value>
      delayedInit?: boolean
    } = {},
  ) {
    if (tableId in DynamicPropertyDB.tables) {
      const source = DynamicPropertyDB.tables[tableId]

      return options?.defaultValue
        ? Object.setPrototypeOf(
            {
              defaultValue: options.defaultValue,
            },
            source,
          )
        : source
    }

    this.tableId = tableId

    if (options.defaultValue) this.defaultValue = options.defaultValue

    DynamicPropertyDB.tables[tableId] = this

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

  proxy(): Record<Key, Value> {
    return this.subproxy(this.value, '', true)
  }

  private _needSaveRun = false

  private needSave() {
    if (this._needSaveRun) return true

    system.delay(() => {
      this._needSaveRun = false
      const str = JSON.stringify(
        // Modify all values
        Object.fromEntries(
          Object.entries(this.value).map(([key, value]) => {
            const defaultv = typeof key !== 'symbol' && this.defaultValue?.(key)

            return [
              // Remove default if defaultv and value are objects
              key,
              typeof value === 'object' && value !== null && typeof defaultv === 'object' && defaultv !== null
                ? DatabaseUtils.removeDefaults(value, defaultv)
                : value,
            ]
          }),
        ),
      )
      const strings = str.match(DatabaseUtils.propertyChunkRegexp)
      if (!strings) throw new DatabaseError('Failed to save db: cannot split')
      world.setDynamicProperty(this.tableId, strings.length)
      for (const [i, string] of strings.entries()) {
        world.setDynamicProperty(this.tableId + DynamicPropertyDB.separator + i, string)
      }
    })

    return (this._needSaveRun = true)
  }

  private subproxyMap = new WeakMap<object, object>()

  private subproxy(
    object: Record<string, any> & { [IS_PROXIED]?: boolean },
    keys: string,
    initial = false,
  ): Record<string, any> {
    if (object[IS_PROXIED]) return object

    const proxied = this.subproxyMap.get(object)
    if (proxied) return proxied

    const proxy = new Proxy(object, {
      get: (target, p, reciever) => {
        // Filter non db keys
        let value = Reflect.get(target, p, reciever)
        if (typeof p === 'symbol' || p === 'toJSON') {
          if (p === 'toJSON') return
          if (p === IS_PROXIED) return true
          if (p === PROXY_TARGET) return target
          return value
        }

        if (value && value[IS_PROXIED]) value = value[PROXY_TARGET]

        // Add default value
        if (initial && typeof value === 'undefined' && this.defaultValue) {
          value = this.defaultValue(p)
          Reflect.set(target, p, value, reciever)
        }

        // Return subproxy on object
        if (typeof value === 'object' && value !== null) {
          return this.subproxy(value, keys + '.' + p)
        } else return value
      },
      set: (target, p, value, reciever) => {
        // Filter non db keys
        if (typeof p === 'symbol') return Reflect.set(target, p, value, reciever)

        // Set value
        if (value[IS_PROXIED]) value = value[PROXY_TARGET]

        const setted = Reflect.set(target, p, value, reciever)
        if (setted) return this.needSave()
        return setted
      },
      deleteProperty: (target, p) => {
        // Filter non db keys
        if (typeof p === 'symbol') return Reflect.deleteProperty(target, p)

        const deleted = Reflect.deleteProperty(target, p)
        if (deleted) return this.needSave()
        return deleted
      },
    })

    Reflect.defineProperty(proxy, PROXY_TARGET, { value: object })
    this.subproxyMap.set(object, proxy)

    return proxy
  }
}

// TODO make all system use database provider
configureDatabase((name, defaultValue?: import('./abstract').DatabaseDefaultValue<Partial<any>>) =>
  new DynamicPropertyDB<string, any>(name, { defaultValue }).proxy(),
)
