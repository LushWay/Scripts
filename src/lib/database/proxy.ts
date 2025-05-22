import { system } from '@minecraft/server'
import type { DatabaseDefaultValue, Table, UnknownTable } from './abstract'

const IS_PROXIED = Symbol('is_proxied')
const PROXY_TARGET = Symbol('proxy_target')

type DynamicObject = Record<string | number | symbol, unknown>
type ProxiedDynamicObject = DynamicObject & { [IS_PROXIED]?: boolean }

export class ProxyDatabase<Value = unknown, Key extends string = string> implements Table<Value, Key> {
  private static getUnproxied<T>(value: T): T {
    if (typeof value === 'object' && value !== null && PROXY_TARGET in value) return value[PROXY_TARGET] as T
    return value
  }

  /**
   * Usefull when a lot of data is being read from object, taken from database.
   *
   * **Caution**: This creates new object on every use, consider using {@link ProxyDatabase.immutableUnproxy} instead
   */
  static unproxy<T>(value: T): T {
    if (value !== null && typeof value === 'object')
      return this.setDefaults({}, this.getUnproxied(value as DynamicObject)) as T

    return value
  }

  /** Usefull when a lot of data is being read from object, taken from database. */
  static immutableUnproxy<T extends object>(value: T): Immutable<T> {
    return this.getUnproxied(value as DynamicObject) as Immutable<T>
  }

  static setDefaults<D extends DynamicObject>(sourceObject: DynamicObject, defaultObject: D): D {
    if (Array.isArray(sourceObject)) {
      return sourceObject as D
    } else if (Array.isArray(defaultObject)) return defaultObject

    // Create a new object to avoid modifying the original object
    const COMPOSED: DynamicObject = {}

    // Copy properties from the defaults object
    for (const key in defaultObject) {
      const value = sourceObject[key]
      const defaultValue = defaultObject[key]

      if (typeof defaultValue === 'object' && defaultValue !== null) {
        // Value is Object or array, recurse...

        if (Array.isArray(defaultValue)) {
          if (typeof value !== 'undefined' && Array.isArray(value)) {
            COMPOSED[key] = [...value]
          } else {
            COMPOSED[key] = [...defaultValue]
          }
        } else {
          if (key in sourceObject) {
            COMPOSED[key] = this.setDefaults(value as DynamicObject, defaultValue as DynamicObject)
          } else {
            // If the original object doesn't have the property, add default value
            // And unlink properties...

            COMPOSED[key] = this.setDefaults({}, defaultValue as DynamicObject)
          }
        }
      } else {
        // Primitive value, assign
        COMPOSED[key] = typeof value === 'undefined' ? defaultValue : value
      }
    }

    // Copy properties from the original object
    for (const key in sourceObject) {
      // If the property is not in the result object, copy it from the original object
      if (!(key in COMPOSED)) {
        COMPOSED[key] = sourceObject[key]
      }
    }

    return COMPOSED as D
  }

  static removeDefaults<S extends DynamicObject>(sourceObject: S, defaultObject: DynamicObject): S {
    if (Array.isArray(sourceObject)) return sourceObject

    // Create a new object to avoid modifying the original object
    const COMPOSED: DynamicObject = {}

    for (const key in sourceObject) {
      const value = sourceObject[key]
      const defaultValue = defaultObject[key]

      if (value === defaultValue) continue

      if (typeof defaultValue === 'object' && defaultValue !== null && typeof value === 'object' && value !== null) {
        if (Array.isArray(defaultValue)) {
          //
          if (Array.isArray(value) && Array.equals(value as unknown[], defaultValue)) continue

          COMPOSED[key] = value
        } else {
          //
          const composedSubObject = this.removeDefaults(value as DynamicObject, defaultValue as DynamicObject)
          if (Object.keys(composedSubObject).length < 1) continue

          COMPOSED[key] = composedSubObject
        }
      } else {
        // Primitive value, assign

        COMPOSED[key] = value
      }
    }

    return COMPOSED as S
  }

  static tables: Record<string, UnknownTable> = {}

  constructor(
    protected id: string,
    protected defaultValue?: DatabaseDefaultValue<Value>,
  ) {
    ProxyDatabase.tables[id] = this as UnknownTable
  }

  getRawValue() {
    return Object.fromEntries(this.value)
  }

  get(key: Key): Value {
    return this.wrap(this.getImmutable(key), '') as Value
  }

  getImmutable(key: Key): Immutable<Value> {
    const value = this.value.get(key)
    if (this.defaultValue && typeof value === 'undefined') {
      this.value.set(key, this.defaultValue(key))
      return this.value.get(key) as Immutable<Value>
    }

    return value as Immutable<Value>
  }

  delete(key: Key): void {
    const deleted = this.value.delete(key)
    if (deleted) this.needSave()
  }

  set(key: Key, value: Value): void {
    this.value.set(key, value)
    this.needSave()
  }

  keys(): MapIterator<Key> {
    return this.value.keys()
  }

  values(): Value[] {
    const values: Value[] = []
    for (const value of this.value.values()) values.push(value)
    return values
  }

  entries(): [Key, Value][] {
    const entries: [Key, Value][] = []
    for (const [key, value] of this.value.entries()) entries.push([key, this.wrap(value, '') as Value])
    return entries
  }

  entriesImmutable(): MapIterator<[Key, Immutable<Value>]> {
    return this.value.entries() as MapIterator<[Key, Immutable<Value>]>
  }

  private wrap(value: unknown, keys: string): unknown {
    if (typeof value !== 'object' || value === null) return value

    const object = value as ProxiedDynamicObject

    if (object[IS_PROXIED]) return object

    const cache = this.proxyCache.get(object)
    if (cache) return cache

    const proxy = new Proxy(object, this.createProxy(keys))
    Reflect.defineProperty(proxy, PROXY_TARGET, { value: object })

    this.proxyCache.set(object, proxy)
    return proxy
  }

  private createProxy(keys: string): ProxyHandler<ProxiedDynamicObject> {
    return {
      get: (target, p, reciever) => {
        // Filter non db keys
        let value = Reflect.get(target, p, reciever)
        if (typeof p === 'symbol' || p === 'toJSON') {
          if (p === 'toJSON') return
          if (p === IS_PROXIED) return true
          if (p === PROXY_TARGET) return target
          return value
        }

        if (value && (value as ProxiedDynamicObject)[IS_PROXIED]) value = (value as ProxiedDynamicObject)[PROXY_TARGET]

        // Return subproxy on object
        if (typeof value === 'object' && value !== null) {
          return this.wrap(value as DynamicObject, keys + '.' + p)
        } else return value
      },
      set: (target, p, value, reciever) => {
        // Filter non db keys
        if (typeof p === 'symbol') return Reflect.set(target, p, value, reciever)

        // Set value
        // eslint-disable-next-line
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
    }
  }

  protected value = new Map<Key, Value>()

  private proxyCache = new WeakMap<DynamicObject, DynamicObject>()

  private needSaveHadRun = false

  private needSave() {
    if (this.needSaveHadRun) return true

    system.delay(() => {
      this.needSaveHadRun = false
      const databaseData = JSON.stringify(
        // Modify all values
        Object.fromEntries(
          [...this.value.entries()].map(([key, value]) => {
            const defaultv = typeof key !== 'symbol' && this.defaultValue?.(key)

            return [
              // Remove default if defaultv and value are objects
              key,
              typeof value === 'object' && value !== null && typeof defaultv === 'object' && defaultv !== null
                ? ProxyDatabase.removeDefaults(value as DynamicObject, defaultv as DynamicObject)
                : value,
            ]
          }),
        ),
      )
      this.save(databaseData)
    })

    return (this.needSaveHadRun = true)
  }

  protected save(databaseData: string) {
    // Subclass should handle saving
  }
}
