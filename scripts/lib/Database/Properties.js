import { system, world } from '@minecraft/server'
import { util } from '../util.js'
import { DB, DatabaseError } from './Default.js'

/**
 * @template {string} [Key=string]
 * @template [Value=undefined]
 */
export class DynamicPropertyDB {
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
   * @type {string}
   */
  key

  /**
   * @private
   * @type {(p: string) => Partial<Value>}
   */
  defaultValue

  /**
   *
   * @param {string} key
   * @param {{
   *   type?: Record<Key, Value>
   *   defaultValue?: (p: string) => Partial<Value>
   *   delayedInit?: boolean
   * }} [options]
   */
  constructor(key, options = {}) {
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

    this.key = key
    if (options.defaultValue) this.defaultValue = options.defaultValue
    DynamicPropertyDB.keys[key] = this

    if (!options.delayedInit) this.init()
  }
  init() {
    // Init
    try {
      const value = world.getDynamicProperty(this.key) ?? '{}'
      if (typeof value !== 'string') {
        throw new DatabaseError(`Expected string, recieved ${typeof value}`)
      }

      this.value = Object.fromEntries(
        Object.entries(JSON.parse(value)).map(([key, value]) => {
          const defaultv = typeof key !== 'symbol' && this.defaultValue?.(key)
          return [
            // Add default value
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
        new DatabaseError(`Failed to init key '${this.key}': ${error}`)
      )
    }
  }
  /**
   *
   * @returns {Record<Key, Value>}
   */
  proxy() {
    return this.subproxy(this.value, '', '', true)
  }

  /** @private */
  _needSaveRun = false
  needSave() {
    if (this._needSaveRun) return

    system.delay(() => {
      this._needSaveRun = false
      world.setDynamicProperty(
        this.key,
        JSON.stringify(
          // Modify all values
          Object.fromEntries(
            Object.entries(this.value).map(([key, value]) => {
              const defaultv =
                typeof key !== 'symbol' && this.defaultValue?.(key)

              return [
                // Remove default if defaultv and value are objects
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
    })
  }

  /**
   *
   * @param {Record<string, any>} object
   * @param {string} key
   * @param {string} keys
   * @returns {Record<string, any>}
   */
  subproxy(object, key, keys, initial = false) {
    return new Proxy(object, {
      get: (target, p, reciever) => {
        // Filter non db keys
        if (p === 'toJSON') return
        let value = Reflect.get(target, p, reciever)
        if (typeof p === 'symbol') return value

        // Add default value
        if (initial && typeof value === 'undefined' && this.defaultValue) {
          value = this.defaultValue(p)
          Reflect.set(target, p, value, reciever)
        }

        // Return subproxy on object
        if (typeof value === 'object' && value !== null) {
          return this.subproxy(value, p, keys + '.' + key)
        } else return value
      },
      set: (target, p, value, reciever) => {
        // Filter non db keys
        if (typeof p === 'symbol')
          return Reflect.set(target, p, value, reciever)

        // Set value
        const setted = Reflect.set(target, p, value, reciever)
        if (setted) this.needSave()
        return setted
      },
    })
  }
}
