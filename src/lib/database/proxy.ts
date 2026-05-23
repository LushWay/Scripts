import { system } from '@minecraft/server'
import type { DatabaseDefaultValue, Table, UnknownTable } from './abstract'
import { deepClone, removeDefaults, setDefaults } from './defaults'

const IS_PROXIED = Symbol('is_proxied')
const PROXY_TARGET = Symbol('proxy_target')

type DynamicObject = Record<string | number | symbol, unknown>
type ProxiedDynamicObject = DynamicObject & { [IS_PROXIED]?: boolean }

type ProxyDatabaseValueCache = WeakMap<DynamicObject, DynamicObject>

export abstract class ProxyDatabase<Value = unknown, Key extends string = string> implements Table<Value, Key> {
  static tables: Record<string, UnknownTable> = {}

  constructor(
    protected id: string,
    protected defaultValue?: DatabaseDefaultValue<Value>,
  ) {
    ProxyDatabase.tables[id] = this as UnknownTable
  }

  abstract onLoad(waiter: (value: void) => void): void

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
    return this.wrap(this.getImmutable(key), key, '') as Value
  }

  getImmutable(key: Key): Immutable<Value> {
    if (!this.loaded) throw new Error(`Proxy table ${this.id} is not yet loaded!`)
    const value = this.value.get(key)
    if (this.defaultValue && typeof value === 'undefined') {
      this.value.set(key, this.defaultValue(key))
      return this.value.get(key) as Immutable<Value>
    }

    return value as Immutable<Value>
  }

  delete(key: Key): boolean {
    if (!this.loaded) throw new Error(`Proxy table ${this.id} is not yet loaded!`)
    const deleted = this.value.delete(key)
    this.proxyCache.delete(key)
    if (deleted) this.needSave()
    return deleted
  }

  set(key: Key, value: Value): void {
    if (!this.loaded) throw new Error(`Proxy table ${this.id} is not yet loaded!`)
    this.value.set(key, deepClone(value))
    this.needSave()
  }

  keys(): MapIterator<Key> {
    if (!this.loaded) throw new Error(`Proxy table ${this.id} is not yet loaded!`)
    return this.value.keys()
  }

  values() {
    if (!this.loaded) throw new Error(`Proxy table ${this.id} is not yet loaded!`)
    return [...this.value.values()] as Immutable<Value>[]
  }

  valuesIterator() {
    if (!this.loaded) throw new Error(`Proxy table ${this.id} is not yet loaded!`)
    return this.value.values() as MapIterator<Immutable<Value>>
  }

  entries(): [Key, Value][] {
    if (!this.loaded) throw new Error(`Proxy table ${this.id} is not yet loaded!`)
    const entries: [Key, Value][] = []
    for (const [key, value] of this.value.entries()) entries.push([key, this.wrap(value, key, '') as Value])
    return entries
  }

  entriesImmutable(): MapIterator<[Key, Immutable<Value>]> {
    if (!this.loaded) throw new Error(`Proxy table ${this.id} is not yet loaded!`)
    return this.value.entries() as MapIterator<[Key, Immutable<Value>]>
  }

  private proxyCache = new Map<string, ProxyDatabaseValueCache>()

  private wrap(value: unknown, key: string, trace: string): unknown {
    if (typeof value !== 'object' || value === null) return value

    const object = value as ProxiedDynamicObject

    if (object[IS_PROXIED]) return object

    return this.proxyCache
      .getOrInsertComputed(key, () => new WeakMap())
      .getOrInsertComputed(object, () => {
        const proxy = new Proxy(object, this.createProxy(key, trace))
        Reflect.defineProperty(proxy, PROXY_TARGET, { value: object })
        return proxy
      })
  }

  private createProxy(key: string, trace: string): ProxyHandler<ProxiedDynamicObject> {
    return {
      get: (target, p, reciever) => {
        // Filter non db keys
        let value = Reflect.get(target, p, reciever)
        if (p === 'toJSON') return
        if (typeof p === 'symbol') {
          if (p === IS_PROXIED) return true
          if (p === PROXY_TARGET) return target
          return value
        }

        if (value && (value as ProxiedDynamicObject)[IS_PROXIED]) value = (value as ProxiedDynamicObject)[PROXY_TARGET]

        if (typeof value === 'object' && value !== null) {
          // Return subproxy on object
          return this.wrap(value, key, trace + '.' + p)
        } else {
          return value
        }
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

  loaded = false

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
