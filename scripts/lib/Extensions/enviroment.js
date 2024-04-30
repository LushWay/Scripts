import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { util } from '../util.js'
import { extend } from './extend.js'

/** Common JavaScript objects */
Object.entriesStringKeys = Object.entries

Date.prototype.toYYYYMMDD = function () {
  const date = new Date(this)
  date.setHours(date.getHours() + 3)
  return date.toLocaleDateString([], { dateStyle: 'medium' }).split('.').reverse().join('-')
}

Date.prototype.toHHMM = function () {
  const date = new Date(this)
  date.setHours(date.getHours() + 3)
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}

Date.prototype.format = function () {
  return this.toHHMM() + ' ' + this.toYYYYMMDD()
}

extend(Math, {
  randomInt(min, max) {
    return Math.round(min + Math.random() * (max + 1 - min))
  },
  randomFloat(min, max) {
    return min + Math.random() * (max - min)
  },
})

extend(Array, {
  equals(one, two) {
    return one.every((e, i) => e === two[i])
  },
})

Array.prototype.randomElement = function () {
  return this[~~(Math.random() * this.length)]
}

/** @param {unknown[]} args */
function format(args) {
  if (!globalThis?.Core?.afterEvents?.worldLoad?.loaded) prefixFormat(args)
  return args
    .map(e =>
      util.toTerminalColors(
        typeof e === 'string'
          ? e
          : typeof e === 'object' && e !== null && e instanceof Error
            ? util.error(e, { parseOnly: true }) ?? 'Empty error (check lib/Extensions/enviroment.js for more detail.)'
            : util.inspect(e),
      ),
    )
    .join(' ')
}

/** @param {unknown[]} args */
function prefixFormat(args) {
  if (typeof args[0] === 'string' && args[0].startsWith('§9')) return

  args.forEach((e, i) => {
    if (typeof e === 'string') {
      args[i] = e.replace(/\n/g, '\n§9│ §r')
    }
  })
  args.unshift('§9│ §r')
}

extend(console, {
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

Object.entriesStringKeys(MinecraftEntityTypes).forEach(([k, v]) => {
  // @ts-expect-error Allow
  MinecraftEntityTypes[k] = 'minecraft:' + v
})
