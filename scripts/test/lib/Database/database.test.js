import { world } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

const arr = []
arr[1] = 4
const proxied = deepproxy(defval())
proxied.x.push(3)
const proxied2 = deepproxy(proxied)
proxied2.x.push(4)
const SHEDULED = new DynamicPropertyDB('ScheduledBlockPlace', {
  /** @type {Record<'x', (number | string)[]>} */
  type: {
    x: [],
  },
  defaultValue: () => [],
})
const SHEDULED_DB = SHEDULED.proxy()
console.debug(world.getDynamicProperty(SHEDULED.tableId))
console.debug({ SHEDULED_DB })
SHEDULED_DB.x.push('dbproxied push')
console.debug({ arr, proxied, proxied2, SHEDULED_DB })
console.debug(world.getDynamicProperty(SHEDULED.tableId))
/**
 * @template {object} T
 * @param {T} source
 * @returns {T}
 */
function deepproxy(source) {
  return new Proxy(source, {
    get(target, p, r) {
      const value = Reflect.get(target, p, r)
      if (typeof value === 'object' && value !== null && typeof p !== 'symbol') {
        return deepproxy(value)
      }
      return value
    },
    set(target, p, r) {
      const setted = Reflect.set(target, p, r)
      return setted
    },
  })
}
function defval() {
  return { x: [1] }
}
