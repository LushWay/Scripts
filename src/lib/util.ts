import { RGB } from '@minecraft/server'
import { TerminalColors } from './assets/terminal-colors'
import stringifyError from './utils/error'
import { inspect, stringify } from './utils/inspect'

export { inspect, stringify, stringifyError }

export const util = {
  /** Runs the given callback safly. If it throws any error it will be handled */
  catch(this: void, fn: () => void | Promise<void>, subtype = 'Handled', originalStack?: string) {
    const prefix = `§6${subtype}: `
    try {
      const promise = fn()
      if (promise instanceof Promise) {
        promise.catch((e: unknown) => {
          console.error(prefix + stringifyError(e as Error, { omitStackLines: 1 }))
        })
      }
    } catch (e: unknown) {
      console.error(
        prefix + stringifyError(e as Error, { omitStackLines: 1 }) + (originalStack ? '\n\n' + originalStack : ''),
      )
    }
  },

  benchmark: Object.assign(
    /**
     * It returns a function that when called, returns the time it took to call the function and records result to const
     *
     * @param {string} label - The name of the benchmark.
     * @returns {(label?: string) => number} A function that returns the time it took to run the function.
     */
    function benchmark(label: string, type = 'test'): (label?: string, subruns?: number) => number {
      const startTime = Date.now()

      return function end(string, tookDivide = 1) {
        const tookTime = (Date.now() - startTime) / tookDivide

        const typeresults = (util.benchmark.results[type] ??= {})
        typeresults[label] = ((typeresults[label] ?? 0) + tookTime) / 2
        if (string) console.debug(`${string}§r §6+${tookTime}ms`)
        return tookTime
      }
    },
    {
      results: {} as Record<string, Record<string, number>>,
    },
  ),

  /**
   * Creates paginator object for array
   *
   * @template T - Item type
   * @param array - Array of items to display
   * @param perPage - Items per page
   * @param startPage - Page to start from
   * @param minLength - Minimal items count to paginate. If array has less then this count, array is returned. Default
   *   is `perPage`
   */
  paginate<const T>(array: readonly T[], perPage = 10, startPage = 1, minLength: number = perPage) {
    if (array.length <= minLength) return { array, canGoNext: false, canGoBack: false, maxPages: 1, page: 1 }

    const maxPages = Math.ceil(array.length / perPage)
    const page = Math.min(Math.max(startPage, 1), maxPages)

    return {
      array: array.slice(page * perPage - perPage, page * perPage),
      canGoNext: page < maxPages,
      canGoBack: page > 1,
      maxPages,
      page,
    }
  },

  /** Replaces each §<color> to its terminal eqiuvalent */
  toTerminalColors(text: string) {
    const r = TerminalColors.r
    if (!r) throw new TypeError('Broken terminal colors: no r')

    return __SERVER__ ? text.replace(/§(.)/g, (_, a: string) => TerminalColors[a] ?? r) + r : text.replace(/§(.)/g, '')
  },

  fromTerminalColorsToMinecraft(string: string) {
    for (const [mc, terminal] of Object.entries(TerminalColors)) {
      string = string.replaceAll(terminal, `§${mc}`)
    }
    return string
  },

  format(args: unknown[]) {
    return args.map(e => util.toTerminalColors(stringify(e))).join(' ')
  },
}

/**
 * Wraps the line
 *
 * @param string
 * @param maxLength
 */
export function wrap(string: string, maxLength: number) {
  /** @type {string[]} */
  const lines: string[] = []
  const rawlines = string.split('')

  for (const char of rawlines) {
    if (!char) continue

    // Empty lines, add first char
    if (!lines.length) {
      lines.push(char)
      continue
    }

    // Last element index
    const i = lines.length - 1
    const line = lines[i] ?? ''
    const lastLineChar = line[line.length - 1]

    if (lastLineChar === '§' || char === '§') {
      // Ignore limit for invisible chars
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      lines[i] += char
    } else if ((char + line).replace(/§./g, '').length > maxLength) {
      // Limit exceeded, newline
      char.trim() && lines.push(char)
    } else {
      // No limit, add char to the line
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      lines[i] += char
    }
  }

  return lines
}

export function wrapLore(lore: string) {
  let color = '§7'
  return wrap(lore, 30).map(e => {
    // Get latest color from the string
    const match = /^.*(§.)/.exec(e)
    if (match?.[1]) color = match[1]
    return '§r' + color + e
  })
}

export function wrapLoreArray(lore: string[]) {
  return lore.map(wrapLore).flat()
}

export type Paginator = ReturnType<(typeof util)['paginate']>

/**
 * Formats big number and adds . separator, e.g. 15000 -> 15.000
 *
 * @param n
 * @returns Formatted string
 */
export function separateNumberWithDots(n = 0, separator = '.') {
  return n.toFixed() !== n.toString() ? n.toFixed(2) : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

/**
 * Helper function used to filter out null and undefined values from array
 *
 *     const array = [false, 'string', null, undefined] // (boolean | string | null | undefined)[]
 *
 *     array.filter(noNullable) // (boolean | string)[]
 *
 * @param value - Array to filter
 * @returns
 */
export function noNullable<T>(value: T): value is NonNullable<T> {
  return typeof value !== 'undefined' && value !== null
}

/**
 * Helper function used to filter out booleans from array
 *
 *     const array = [false, 'string', { object: true }] // (boolean | string | {..})[]
 *
 *     array.filter(noBoolean) // (string | {...})[]
 *
 * @param value - Array to filter
 * @returns
 */
export function noBoolean<T>(value: T): value is Exclude<T, boolean> {
  return value !== false && value !== true
}

type Key = string | symbol | number

/**
 * Checks if a given key is an existing key of a specified object.
 *
 *     enum Example {
 *       Value = 'value',
 *       Another = 'another
 *     }
 *     const a = 'value'
 *
 *     if (a in Example) Example[a] // type error
 *     if (isKeyof(a, example)) Example[a] // works!
 *
 * @param {Key} key - Key that you want to check if it exists in the provided object.
 * @param {O} object - Object to check key on
 * @returns Boolean value indicating whether the `key` provided is a key of the `object` provided.
 */
export function isKeyof<O extends Record<Key, unknown>>(key: Key, object: O): key is keyof O {
  return key in object
}

export function hexToRgb(hex: `#${string}`): RGB {
  const rgb = hex
    // Normalize hex
    .replace(/^#?([a-f\d]{6})$/i, (_, r: string) => r)
    .match(/.{2}/g)
    ?.map(x => parseInt(x, 16) / 256)

  if (!rgb) throw new TypeError(`HEX ${hex} is invalid. Expected #[a-f\\d][a-f\\d][a-f\\d]`)
  const [red, green, blue] = rgb as [number, number, number]

  return { red, green, blue }
}

/** Returns the size of an object or array by checking its length or number of keys. */
export function sizeOf(target: object | unknown[]): number {
  if (Array.isArray(target)) return target.length
  return Object.keys(target).length
}

/** Checks whenether provided object or array has 0 keys */
export function isEmpty(target: object | unknown[]): boolean {
  return sizeOf(target) === 0
}

/** Empty function that does nothing. */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const doNothing = () => {}
/** Adds minecraft: namespace to the text if not added already */

export function addNamespace(text: string) {
  return text.includes(':') ? text : `minecraft:${text}`
}

export function removeNamespace(text: string) {
  return text.replace(/^minecraft:/, '')
}

Promise.withResolvers = <T>() => {
  let resolve: ((value: T | PromiseLike<T>) => void) | undefined
  let reject: ((value: Error) => void) | undefined
  const promise = new Promise<T>((r, j) => ((resolve = r), (reject = j)))
  if (!resolve || !reject) throw new TypeError('Promise is broken lol')
  return { resolve, reject, promise }
}

export function capitalize<T extends string>(str: T) {
  return ((str[0] ?? '').toUpperCase() + str.slice(1)) as Capitalize<T>
}

export function pick<T extends object, K extends keyof T>(object: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(Object.entries(object).filter(([key]) => keys.includes(key as K))) as Pick<T, K>
}
