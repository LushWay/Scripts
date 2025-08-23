import { system } from '@minecraft/server'
import type { DatabaseDefaultValue, Table, UnknownTable } from './abstract'
import { removeDefaults, setDefaults } from './defaults'

const IS_PROXIED = Symbol('is_proxied')
const PROXY_TARGET = Symbol('proxy_target')

type DynamicObject = Record<string | number | symbol, unknown>
type ProxiedDynamicObject = DynamicObject & { [IS_PROXIED]?: boolean }

export class ProxyDatabase<Value = unknown, Key extends string = string> implements Table<Value, Key> {
  static tables: Record<string, UnknownTable> = {}

  constructor(
    protected id: string,
    protected defaultValue?: DatabaseDefaultValue<Value>,
  ) {
    ProxyDatabase.tables[id] = this as UnknownTable
  }

  get size(): number {
    return this.value.size
  }

  has(key: Key): boolean {
    return this.value.has(key)
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

  delete(key: Key): boolean {
    const deleted = this.value.delete(key)
    if (deleted) this.needSave()
    return deleted
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

  valuesImmutable() {
    return this.value.values() as MapIterator<Immutable<Value>>
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

  protected restore(from: Record<string, unknown>) {
    return Object.entries(from).map(([key, value]) => {
      const defaultv = typeof key !== 'symbol' && this.defaultValue?.(key)
      return [
        // Add default value
        key as Key,
        (typeof value === 'object' && value !== null && typeof defaultv === 'object' && defaultv !== null
          ? setDefaults(value as JsonObject, defaultv as JsonObject)
          : (value ?? defaultv)) as Value,
      ] as [Key, Value]
    })
  }

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
                ? removeDefaults(value as DynamicObject, defaultv as DynamicObject)
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
