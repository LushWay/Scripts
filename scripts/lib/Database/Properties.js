import { Player, World, system, world } from '@minecraft/server'
import { util } from '../util.js'
import { DB, DatabaseError } from './Default.js'

/**
 * @template {string} [Key = string]
 * @template [Value=undefined]
 * @param {string} key
 * @param {{defaultValue?: DynamicPropertyDB<Key, Value>["defaultValue"]}} [options]
 * @param {World | Player} [source=world]
 * @returns {any}
 */
export function DPDBProxy(key, options, source) {
  return new DynamicPropertyDB(key, options, source).proxy()
}

/**
 * @template {string} [Key = string]
 * @template [Value=undefined]
 */
class DynamicPropertyDB {
  /**
   * @type {Record<string, DynamicPropertyDB<any, any>>}
   */
  static keys = {}

  /**
   * @private
   * @type {Record<any, any>}
   */
  value = {}

  /**
   *
   * @param {string} key
   * @param {{defaultValue?: DynamicPropertyDB<Key, Value>["defaultValue"]}} [options]
   * @param {World | Player} [source=world]
   */
  constructor(key, options = {}, source = world) {
    if (key in DynamicPropertyDB.keys) {
      const source = DynamicPropertyDB.keys[key]
      return options?.defaultValue
        ? Object.setPrototypeOf(
            {
              defaultValue: options.defaultValue,
            },
            source
          )
        : source
    }

    /** @type {World | Player} */
    this.source = source
    /** @type {string} */
    this.key = key
    if (options.defaultValue) this.defaultValue = options.defaultValue
    DynamicPropertyDB.keys[key] = this

    this.init()
  }
  init() {
    // Init
    try {
      const value = this.source.getDynamicProperty(this.key) ?? '{}'
      if (typeof value !== 'string') {
        throw new DatabaseError(`Expected string, recieved ${typeof value}`)
      }

      this.value = Object.fromEntries(
        Object.entries(JSON.parse(value)).map(([key, value]) => {
          const defaultv = typeof key !== 'symbol' && this.defaultValue(key)
          return [
            key,
            typeof value === 'object' &&
            value !== null &&
            typeof defaultv === 'object' &&
            defaultv !== null
              ? DB.setDefaults(value, defaultv)
              : value ?? defaultv,
          ]
        })
      )
    } catch (error) {
      util.error(
        new DatabaseError(`Failed to parse init key '${this.key}': ${error}`)
      )
    }
  }
  /**
   *
   * @returns {Record<string, Value>}
   */
  proxy() {
    return this.subproxy(this.value, '', '', true)
  }

  /** @private */
  _needSave = false
  needSave() {
    if (!this._needSave)
      system.run(() =>
        util.catch(() => {
          this.source.setDynamicProperty(
            this.key,
            JSON.stringify(
              Object.fromEntries(
                Object.entries(this.value).map(([key, value]) => {
                  const defaultv =
                    typeof key !== 'symbol' && this.defaultValue(key)
                  return [
                    key,
                    typeof value === 'object' &&
                    value !== null &&
                    typeof defaultv === 'object' &&
                    defaultv !== null
                      ? DB.removeDefaults(value, defaultv)
                      : value,
                  ]
                })
              )
            )
          )
          this._needSave = false
        }, 'DynamicPropertySave')
      )
  }

  /**
   *
   * @private
   * @param {string} p
   * @returns {NonNullable<Value> extends JSONLike ? Partial<Value> : Value}
   */
  defaultValue(p) {
    return {}
  }

  /**
   *
   * @param {Record<string, any>} object
   * @param {string} key
   * @param {string} keys
   * @returns {Record<string, any>}
   */
  subproxy(object, key, keys, initial = false) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const db = this
    return new Proxy(object, {
      get(target, p, reciever) {
        let value = Reflect.get(target, p, reciever)
        if (typeof p === 'symbol') return value
        if (typeof value === 'undefined') {
          value = db.defaultValue(p)
          Reflect.set(target, p, value, reciever)
        }
        if (typeof value === 'object' && value !== null) {
          return db.subproxy(value, p, keys + '.' + key)
        }

        return value
      },
      set(target, p, value, reciever) {
        if (typeof p === 'symbol') {
          return Reflect.set(target, p, value, reciever)
        }
        // if (typeof value === "object") {
        // 	Object.defineProperties(
        // 		value,
        // 		Object.fromEntries(
        // 			Object.entries(Object.getOwnPropertyDescriptors(value))
        // 				.filter(([_, d]) => (d.writable || d.set) && d.configurable)
        // 				.map(([key, descriptor]) => {
        // 					console.log({ key, descriptor });
        // 					/** @type {any} */
        // 					let v1 = descriptor.value;
        // 					delete descriptor.value;
        // 					delete descriptor.writable;

        // 					const originalSet = descriptor.set?.bind(descriptor);
        // 					descriptor.set = (v2) => {
        // 						db.needSave();
        // 						originalSet ? originalSet(v2) : (v1 = v2);
        // 					};
        // 					if (descriptor.get) {
        // 						descriptor.get =
        // 							descriptor.get?.bind(descriptor) ?? (() => v1);
        // 					}

        // 					return [key, descriptor];
        // 				}),
        // 		),
        // 	);
        // }

        const setted = Reflect.set(target, p, value, reciever)
        if (setted) db.needSave()
        return setted
      },
    })
  }
}

Object.defineProperty(Player.prototype, 'database', {
  enumerable: true,
  configurable: false,
  get() {
    return null
  },
})
