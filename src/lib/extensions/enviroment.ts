import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Language } from 'lib/assets/lang'
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

String.prototype.to = function () {
  return this as string
}

/** Common JavaScript objects */
Object.entriesStringKeys = Object.entries

Object.map = (object, mapper) => {
  const result: Record<string, unknown> = {}

  for (const key of Object.getOwnPropertyNames(object)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const mapped = mapper(key, object[key] as any, object)
    if (mapped) result[mapped[0]] = mapped[1]
  }

  return result as Record<string | number | symbol, never>
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
    shuffle(): T[]
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

Array.prototype.shuffle = function (this: unknown[]) {
  let i = this.length
  while (i) {
    const j = Math.floor(Math.random() * i)
    const t = this[--i]
    this[i] = this[j]
    this[j] = t
  }
  return this
}

Array.prototype.randomElement = function (this: unknown[]) {
  return this[~~(Math.random() * this.length)]
}

expand(Array, {
  equals(one, two) {
    return one.length === two.length && one.every((e, i) => e === two[i])
  },
})

declare global {
  interface String {
    at(n: number): string
  }
}

expand(console, {
  error(...args: unknown[]) {
    super.error(util.format(args))
  },
  warn(...args: unknown[]) {
    super.warn(util.format(args))
  },
  info(...args: unknown[]) {
    super.info(util.format(args))
  },
  log(...args: unknown[]) {
    super.log(util.format(args))
  },
  debug(...args: unknown[]) {
    super.log(util.format(args))
  },
  verbose(...args: unknown[]) {
    if (verbose) super.log(util.format(args))
  },
})

globalThis.verbose = false

Object.entriesStringKeys(MinecraftEntityTypes).forEach(([k, v]) => {
  if (v.includes(':')) return

  // @ts-expect-error We force add prefix because WHY IT DOES NOT HAVE ONE
  MinecraftEntityTypes[k] = 'minecraft:' + v
})

declare global {
  interface Date {
    /** Converts date to format DD-MM-YYYY HH:MM:SS */
    format(lang?: Language): string

    /**
     * Converts date to format DD-MM-YYYY
     *
     * @example
     *   new Date().toYYYYMMDD() === '04-12-2025'
     *   new Date(Language.ru_RU).toYYYYMMDD() === '04-12-2025'
     */
    toYYYYMMDD(lang?: Language): string

    /** Converts date to format HH:MM */
    toHHMM(lang?: Language): string

    /**
     * Converts date to format HH:MM:SS
     *
     * @example
     *   new Date().toYYMMSS() === '00:12:31'
     *   new Date(Language.ru_RU).toYYMMSS() === '03:12:31'
     */
    toHHMMSS(lang?: Language): string
  }
}

function getTimezone(language?: Language) {
  switch (language) {
    case Language.ru_RU:
      return 3
    default:
      return 0
  }
}

Date.prototype.toYYYYMMDD = function (lang) {
  // Ignore lang support and timezone for now. Maybe use date.toLocaleDateString in future
  const date = new Date(this)
  date.setHours(date.getHours() + getTimezone(lang))
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${day}-${month}-${year}`
}

Date.prototype.toHHMM = function (lang) {
  const date = new Date(this)
  date.setHours(date.getHours() + getTimezone(lang))
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

Date.prototype.toHHMMSS = function (lang) {
  const seconds = this.getSeconds().toString().padStart(2, '0')
  return `${this.toHHMM(lang)}:${seconds}`
}

Date.prototype.format = function (lang) {
  return `${this.toHHMM(lang)} ${this.toYYYYMMDD()}`
}
