import { Player, World, system, world } from '@minecraft/server'
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
   * @type {Record<string, DynamicPropertyDB<any>>}
   */
  static playerKeys = {}

  /**
   * @param {DynamicPropertyDB<any, any>} db
   */
  static getValue(db) {
    return db.value
  }

  /**
   * @private
   * @type {Record<any, any>}
   */
  value = {}

  /**
   * @type {World | Player}
   */
  source

  /**
   * @type {string}
   */
  key

  /**
   *
   * @param {string} key
   * @param {{
   *   type?: Record<Key, Value>
   *   defaultValue?: (p: string) => Partial<Value>
   *   delayedInit?: boolean
   * }} [options]
   * @param {World | Player} [source]
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

    this.source = source
    this.key = key
    if (options.defaultValue) this.defaultValue = options.defaultValue
    DynamicPropertyDB.keys[key] = this

    if (!options.delayedInit) this.init()
  }
  init() {
    // Init
    try {
      const value = this.source.getDynamicProperty(this.key) ?? '{}'
      if (typeof value !== 'string') {
        throw new DatabaseError(
          `Key ${this.key}, Source ${
            this.source instanceof World
              ? 'world'
              : 'player::' + this.source.name
          } Expected string, recieved ${typeof value}`
        )
      }

      this.value = Object.fromEntries(
        Object.entries(JSON.parse(value)).map(([key, value]) => {
          const defaultv = typeof key !== 'symbol' && this.defaultValue?.(key)
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
   * @returns {Record<Key, Value>}
   */
  proxy() {
    return this.subproxy(this.value, '', '', true)
  }

  /** @private */
  _needSaveRun = false
  needSave() {
    if (this._needSaveRun) return

    system.run(() =>
      util.catch(() => {
        this._needSaveRun = false
        this.source.setDynamicProperty(
          this.key,
          JSON.stringify(
            Object.fromEntries(
              Object.entries(this.value).map(([key, value]) => {
                const defaultv =
                  typeof key !== 'symbol' && this.defaultValue?.(key)
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
      }, 'DynamicPropertySave')
    )
  }

  /**
   * @private
   * @type {(p: string) => Partial<Value>}
   */
  defaultValue

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
        if (p === 'toJSON') return
        let value = Reflect.get(target, p, reciever)
        if (typeof p === 'symbol') return value
        if (initial && typeof value === 'undefined' && this.defaultValue) {
          value = this.defaultValue(p)
          Reflect.set(target, p, value, reciever)
        }
        if (typeof value === 'object' && value !== null) {
          return this.subproxy(value, p, keys + '.' + key)
        }

        return value
      },
      set: (target, p, value, reciever) => {
        if (typeof p === 'symbol') {
          return Reflect.set(target, p, value, reciever)
        }

        const setted = Reflect.set(target, p, value, reciever)
        if (setted) this.needSave()
        return setted
      },
    })
  }
}
