import { util } from '../util.js'
import { OverTakes } from './OverTakes.js'

Object.entriesStringKeys = Object.entries

/**
 * Common JavaScript objects
 *
 *
 */
OverTakes(JSON, {
  safeParse(str, reciever, onError) {
    try {
      return JSON.parse(str, reciever)
    } catch (e) {
      onError && onError(e)
    }
  },
})

OverTakes(Math, {
  randomInt(min, max) {
    return Math.round(min + Math.random() * (max + 1 - min))
  },
  randomFloat(min, max) {
    return min + Math.random() * (max - min)
  },
})

OverTakes(Array, {
  equals(one, two) {
    return one.every((e, i) => e === two[i])
  },
})

Array.prototype.randomElement = function () {
  return this[~~(Math.random() * this.length)]
}

/**
 *
 * @param  {any[]} args
 */
function format(args) {
  return args.map(e => util.toTerminalColors(typeof e === 'string' ? e : util.inspect(e))).join(' ')
}

OverTakes(console, {
  error(...args) {
    super.error(format(args))
  },
  warn(...args) {
    super.warn(format(args))
  },
  info(...args) {
    super.info(format(args))
  },
  log(...args) {
    super.log(format(args))
  },
  debug(...args) {
    super.log(format(args))
  },
  verbose(...args) {
    if (verbose) super.log(format(args))
  },
})

// @ts-expect-error Assign
globalThis.nextTick = null
// @ts-expect-error Assign
globalThis.verbose = false
