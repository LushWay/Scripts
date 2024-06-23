/* eslint-disable no-var */

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { util } from '../util'
import { expand } from './extend'

declare global {
  interface Console {
    error(...data: unknown[]): void
    info(...data: unknown[]): void
    log(...data: unknown[]): void
    warn(...data: unknown[]): void
    debug(...data: unknown[]): void
    verbose(...data: unknown[]): void
  }

  var console: Console
  var verbose: boolean

  interface ObjectConstructor {
    entriesStringKeys<O extends Record<string, unknown>>(o: O): [keyof O, O[keyof O]][]
    fromEntries<V = unknown, K extends string = string>(entries: Iterable<readonly [K, V]>): Record<K, V>

    keys<T extends Record<string, unknown>>(o: T): (keyof T extends string ? keyof T : never)[]

    /**
     * Creates a new object by applying a mapper function to each key-value pair in the input object.
     *
     * @example
     *   Object.map({ a: 1, b: 2, c: 3 }, (key, value) => [key + 'A', value]) // { aA: 1, bA: 2, cA: 3 }
     *
     * @param object - The input object to be processed.
     * @param mapper - A function that takes a value, key, and the original object, and returns a new key-value pair as
     *   a tuple [newKey, newValue]. If the mapper returns false, the key-value pair is excluded from the new object.
     * @returns A new object constructed from the key-value pairs returned by the mapper.
     */
    map<T extends Record<string, unknown>, K2 extends string, V2>(
      object: T,
      mapper: (key: keyof T, value: Required<T>[keyof T], object: NoInfer<T>) => [K2, V2] | false,
    ): NoInfer<Record<K2, V2>>
  }
}

/** Common JavaScript objects */
Object.entriesStringKeys = Object.entries

Object.map = (object, mapper) => {
  const result: Record<string, unknown> = {}

  for (const key of Object.getOwnPropertyNames(object)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const mapped = mapper(key as any, (object as any)[key], object)
    if (mapped) result[mapped[0]] = mapped[1]
  }

  return result as any
}

declare global {
  interface Math {
    /**
     * Returns a random integer between the specified minimum and maximum values.
     *
     * @example
     *   Math.randomInt(0, 2) // 2
     *   Math.randomInt(1, 2) // 1
     *
     * @param min - Minimum value of the range from which you want to generate a random integer.
     * @param max - Maximum value that you want the random integer to be generated within.
     * @returns Random integer between the `min` and `max` values (inclusive).
     */
    randomInt(minimum: number, maximum: number): number
    /**
     * Returns a random floating-point number. It uses `Math.random()` to generate a random number between 0 (inclusive)
     * and 1 (exclusive), then scales and shifts this number to fall within the specified range.
     *
     * @param min - Minimum value of the range from which you want to generate a random integer.
     * @param max - Maximum value that you want the random integer to be generated within.
     */
    randomFloat(minimum: number, maximum: number): number
  }
}

expand(Math, {
  randomInt(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min))
  },
  randomFloat(min, max) {
    return min + Math.random() * (max - min)
  },
})

declare global {
  interface Array<T> {
    /**
     * Returns random array element. Alias to
     *
     *     array[~~(Math.random() * array.length)]
     */
    randomElement(): T
    at(n: number): T
  }

  interface ArrayConstructor {
    /**
     * Checks if two arrays are the same
     *
     * @param one
     * @param two
     */
    equals(one: unknown[], two: unknown[]): boolean
  }
}

Array.prototype.randomElement = function () {
  return this[~~(Math.random() * this.length)]
}

expand(Array, {
  equals(one, two) {
    return one.every((e, i) => e === two[i])
  },
})

declare global {
  interface String {
    at(n: number): string
  }
}

function format(args: unknown[]) {
  const isPacket = typeof args[0] === 'string' && args[0].startsWith('[Packet]')
  if (typeof globalThis.loaded === 'number' && globalThis.loaded !== 0 && !isPacket && !__VITEST__) prefixFormat(args)
  return args
    .map(e =>
      util.toTerminalColors(
        typeof e === 'string'
          ? e
          : typeof e === 'object' && e !== null && e instanceof Error
            ? util.error(e)
            : util.inspect(e),
      ),
    )
    .join(' ')
}

function prefixFormat(args: unknown[]) {
  if (typeof args[0] === 'string' && args[0].startsWith('§9')) return

  args.forEach((e, i) => {
    if (typeof e === 'string') {
      args[i] = e.replace(/\n/g, '\n§9│ §r')
    }
  })
  args.unshift('§9│ §r')
}

expand(console, {
  error(...args: unknown[]) {
    super.error(format(args))
  },
  warn(...args: unknown[]) {
    super.warn(format(args))
  },
  info(...args: unknown[]) {
    super.info(format(args))
  },
  log(...args: unknown[]) {
    super.log(format(args))
  },
  debug(...args: unknown[]) {
    super.log(format(args))
  },
  verbose(...args: unknown[]) {
    if (verbose) super.log(format(args))
  },
})

globalThis.verbose = false

Object.entriesStringKeys(MinecraftEntityTypes).forEach(([k, v]) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  MinecraftEntityTypes[k] = 'minecraft:' + v
})

declare global {
  interface Date {
    /**
     * Converts date to format DD-MM-YYYY HH:MM:SS
     *
     * @param seconds Adds :SS to format
     */
    format(seconds?: boolean): string

    /** Converts date to format DD-MM-YYYY */
    toYYYYMMDD(): string

    /**
     * Converts date to format HH:MM
     *
     * @param seconds Adds :SS to format
     */
    toHHMM(seconds?: boolean): string
  }
}

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
