import { system } from '@minecraft/server'

const IS_PROXIED = Symbol('is_proxied')
const PROXY_TARGET = Symbol('proxy_target')

export class ProxyDatabase<Key extends string = string, Value = undefined> {
  private static getUnproxied<T extends object>(value: T): T {
    if (typeof value === 'object' && value !== null && PROXY_TARGET in value) return value[PROXY_TARGET] as T
    return value
  }

  /**
   * Usefull when a lot of data is being read from object, taken from database.
   *
   * **Caution**: This creates new object on every use, consider using {@link ProxyDatabase.immutableUnproxy} instead
   */
  static unproxy<T extends object>(value: T): T {
    if (typeof value === 'object' && value !== null) return this.setDefaults({}, this.getUnproxied(value))
    return value
  }

  /** Usefull when a lot of data is being read from object, taken from database. */
  static immutableUnproxy<T extends object>(value: T): Immutable<T> {
    return this.getUnproxied(value) as Immutable<T>
  }

  static setDefaults<O extends JSONLike, D extends JSONLike>(sourceObject: O, defaultObject: D): O & D {
    if (Array.isArray(sourceObject)) {
      return sourceObject
    } else if (Array.isArray(defaultObject)) return defaultObject

    // Create a new object to avoid modifying the original object
    const COMPOSED: JSONLike = {}

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
            COMPOSED[key] = this.setDefaults(value, defaultValue)
          } else {
            // If the original object doesn't have the property, add default value
            // And unlink properties...

            COMPOSED[key] = this.setDefaults({}, defaultValue)
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

    return COMPOSED
  }

  static removeDefaults<S extends JSONLike>(sourceObject: S, defaultObject: JSONLike): S {
    if (Array.isArray(sourceObject)) return sourceObject

    // Create a new object to avoid modifying the original object
    const COMPOSED: JSONLike = {}

    for (const key in sourceObject) {
      const value = sourceObject[key]
      const defaultValue = defaultObject[key]

      if (value === defaultValue) continue

      if (typeof defaultValue === 'object' && defaultValue !== null && typeof value === 'object' && value !== null) {
        if (Array.isArray(defaultValue)) {
          //
          if (Array.isArray(value) || Array.equals(value, defaultValue)) continue

          COMPOSED[key] = value
        } else {
          //
          const composedSubObject = this.removeDefaults(value, defaultValue)
          if (Object.keys(composedSubObject).length < 1) continue

          COMPOSED[key] = composedSubObject
        }
      } else {
        // Primitive value, assign

        COMPOSED[key] = value
      }
    }

    return COMPOSED
  }

  static tables: Record<string, import('./abstract').DatabaseTable> = {}

  constructor(
    protected id: string,
    protected defaultValue?: import('./abstract').DatabaseDefaultValue<Value>,
  ) {
    ProxyDatabase.tables[id] = this.proxy()
  }

  proxy(): Record<Key, Value> {
    return this.subproxy(this.value, '', true)
  }

  private subproxy(
    object: Record<string, any> & { [IS_PROXIED]?: boolean },
    keys: string,
    initial = false,
  ): Record<string, any> {
    if (object[IS_PROXIED]) return object

    const cache = this.proxyCache.get(object)
    if (cache) return cache

    const proxy = new Proxy(object, this.createProxy(initial, keys))
    Reflect.defineProperty(proxy, PROXY_TARGET, { value: object })

    this.proxyCache.set(object, proxy)
    return proxy
  }

  private createProxy(initial: boolean, keys: string): ProxyHandler<Record<string, any> & { [IS_PROXIED]?: boolean }> {
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
    }
  }

  protected value: Record<any, any> = {}

  private proxyCache = new WeakMap<object, object>()

  private needSaveHadRun = false

  private needSave() {
    if (this.needSaveHadRun) return true

    system.delay(() => {
      this.needSaveHadRun = false
      const databaseData = JSON.stringify(
        // Modify all values
        Object.fromEntries(
          Object.entries(this.value).map(([key, value]) => {
            const defaultv = typeof key !== 'symbol' && this.defaultValue?.(key)

            return [
              // Remove default if defaultv and value are objects
              key,
              typeof value === 'object' && value !== null && typeof defaultv === 'object' && defaultv !== null
                ? ProxyDatabase.removeDefaults(value, defaultv)
                : value,
            ]
          }),
        ),
      )
      this.save(databaseData)
    })

    return (this.needSaveHadRun = true)
  }

  protected save(databaseData: string) {}
}
