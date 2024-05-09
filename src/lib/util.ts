import { TerminalColors } from './assets/terminal-colors'

export const util = {
  error: Object.assign(
    /**
     * Stringify and show error in console
     *
     * @param {{ message: string; stack?: string; name?: string } | string} error
     * @param {object} [options]
     * @param {number} [options.omitStackLines]
     * @param {string} [options.errorName] - Overrides error name
     * @param {boolean} [options.parseOnly] - Whenever to log error to console or not.
     * @param {string} [options.subtype]
     */
    function error(
      error: { message: string; stack?: string; name?: string } | string,
      {
        omitStackLines = 0,
        errorName,
        parseOnly,
        subtype,
      }: { omitStackLines?: number; errorName?: string; parseOnly?: boolean; subtype?: string } = {},
    ) {
      if (typeof error === 'string') {
        error = new Error(error)
        error.name = 'StringError'
      }

      const stack = util.error.stack.get(omitStackLines + 1, error.stack)
      const message = util.error.message.get(error)
      const name = errorName ?? error.name ?? 'Error'
      const text = `${subtype ? `§6${subtype}: ` : ''}§4${name}: §c${message}\n§f${stack}`

      if (!parseOnly) {
        try {
          console.error(text)
        } catch (e) {
          console.error(text, e)
        }
      }

      return text
    },
    {
      /**
       * Checks if provided argument is instanceof Error
       *
       * @param {unknown} object
       * @returns {object is Error}
       */
      isError(object: unknown): object is Error {
        return typeof object === 'object' && object !== null && object instanceof Error
      },
      stack: {
        modifiers: [
          [/\\/g, '/'],
          [/<anonymous>/, 'ƒ'],
          [/ƒ \((.+)\)/, 'ƒ $1'],
          [/(.*)\(native\)(.*)/, '§8$1(native)$2§f'],
          [s => (s.includes('lib') ? `§7${s.replace(/§./g, '')}§f` : s)],
          [s => (s.startsWith('§7') ? s : s.replace(/:(\d+)/, ':§6$1§f'))],
        ] as [RegExp | ((s: string) => string), string?][],

        /** Parses stack */
        get(omitLines: number = 0, stack?: string): string {
          if (!stack) {
            stack = new Error().stack
            if (!stack) return 'Null stack'
            stack = stack
              .split('\n')
              .slice(omitLines + 1)
              .join('\n')
          }

          const stackArray = stack.split('\n')

          const mappedStack = stackArray
            .map(e => e?.replace(/\s+at\s/g, '')?.replace(/\n/g, ''))
            .map(e => {
              for (const [r, p] of this.modifiers) {
                if (typeof e !== 'string' || e.length < 1) break

                if (typeof r === 'function') e = r(e)
                else e = e.replace(r, p ?? '')
              }
              return e
            })
            .filter(e => e && /^\s*\S/g.test(e))
            .map(e => `   ${e}\n`)

          return mappedStack.join('')
        },
      },
      message: {
        modifiers: [
          // [/\n/g, ''],
          [/Module \[(.*)\] not found\. Native module error or file not found\./g, '§cNot found: §6$1', 'LoadError'],
        ] as [RegExp | string, string, string?][],

        /** @param {{ message?: string; name?: string }} error */
        get(error: { message?: string; name?: string }) {
          let message = error.message ?? ''
          for (const [find, replace, newname] of this.modifiers) {
            const newmessage = message.replace(find, replace)
            if (newmessage !== message && newname) error.name = newname
            message = newmessage
          }

          return message
        },
      },
    },
  ),

  /** @param {any} target */
  stringify(target: any) {
    if (typeof target === 'string') return target
    return this.inspect(target)
  },

  /** @param {any} target */
  inspect(target: any, space = '  ', cw = '', funcCode = false, depth = 0) {
    const c = {
      function: {
        function: '§5',
        name: '§9',
        arguments: '§f',
        code: '§8',
        brackets: '§7',
      },

      nonstring: '§6',
      symbol: '§7',
      string: '§3',
    }

    const uniqueKey = Date.now().toString()

    // avoid Circular structure error
    const visited = new WeakSet()

    if (depth > 10 || typeof target !== 'object') return `${rep(target)}` || `${target}` || '{}'

    /** @param {any} value */
    function rep(value: any) {
      if (visited.has(value)) {
        // Circular structure detected
        return '§b<Circular>§r'
      } else {
        try {
          visited.add(value)
        } catch (e) {}
      }

      switch (typeof value) {
        case 'function': {
          /** @type {string} */
          let r: string = value.toString().replace(/[\n\r]/g, '')

          if (!funcCode) {
            const native = r.includes('[native code]')
            const code = native ? ' [native code] ' : '...'
            let isArrow = true
            let name = ''

            if (r.startsWith('function')) {
              r = r.replace(/^function\s*/, '')
              isArrow = false
            }

            const match = r.match(/(\w*)\(/)?.[1]
            if (match) {
              name = match
              r = r.replace(name, '')
            }

            let args = '()',
              bracket = false,
              escape = false

            for (const [i, char] of r.split('').entries()) {
              if (char === '"' && !escape) {
                bracket = !bracket
              }

              if (char === '\\') {
                escape = true
              } else escape = false

              if (!bracket && char === ')') {
                args = r.substring(0, i)
                break
              }
            }
            const cl = c.function
            // function
            r = `${isArrow ? '' : `${cl.function} ƒ `}`
            // "name"
            r += `${cl.name}${name}`
            // "(arg, arg)"
            r += `${cl.arguments}${args})`
            // " => "  or  " "
            r += `${cl.function}${isArrow ? ' => ' : ' '}`
            // "{ code }"
            r += `${cl.brackets}{${cl.code}${code}${cl.brackets}}§r`
          }

          value = r

          break
        }

        case 'object': {
          if (Array.isArray(value)) break

          /** @type {any} */
          const allInherits: any = {}

          for (const key in value)
            try {
              // value[key] can be ungettable
              allInherits[key] = value[key]
            } catch (e) {}

          value = allInherits
          break
        }
        case 'symbol':
          value = `${c.symbol}[Symbol.${value.description}]§r`
          break

        case 'string':
          value = `${c.string}\`${value.replace(/"/g, uniqueKey).replace(/§/g, '§§')}\`§r`
          break

        default:
          value = c.nonstring + value + '§r'
          break
      }
      return value
    }

    return JSON.stringify(target, (_, value) => rep(value), space)
      ?.replace(/"/g, cw)
      ?.replace(new RegExp(uniqueKey, 'g'), '"')
      ?.slice(0, 1000)
  },

  /**
   * Instantly runs given function and if it throws synhronous error it will be catched and returned as second element
   * in the array
   *
   * @param fn
   */
  run<T extends () => unknown = () => unknown>(
    fn: T,
  ): [result: ReturnType<T>, error: undefined] | [result: undefined, error: unknown] {
    try {
      return [fn() as ReturnType<T>, void 0]
    } catch (error) {
      return [void 0, error]
    }
  },

  /** Runs the given callback safly. If it throws any error it will be handled */
  catch(fn: () => void | Promise<void>, subtype = 'Handled') {
    try {
      const promise = fn()
      if (promise instanceof Promise) promise.catch(e => this.error(e, { omitStackLines: 1, subtype }))
    } catch (e) {
      this.error(e, { omitStackLines: 1, subtype })
    }
  },

  /**
   * Gets plural form based on provided number
   *
   * @param n - Number
   * @param forms - Plurals forms in format `1 секунда 2 секунды 5 секунд`
   * @returns Plural form. Currently only Russian supported
   */
  ngettext(n: number, [one = 'секунда', few = 'секунды', more = 'секунд']: Plurals) {
    if (!Number.isInteger(n)) return more
    return [one, few, more][
      n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
    ]
  },

  ms: {
    /**
     * Parses the remaining time in milliseconds into a more human-readable format
     *
     * @example
     *   const {type, value} = util.ms.remaining(1000)
     *   console.log(value + ' ' + type) // 1 секунда
     *
     * @example
     *   const {type, value} = util.ms.remaining(1000 * 60 * 2)
     *   console.log(value + ' ' + type) // 2 минуты
     *
     * @example
     *   const {type, value} = util.ms.remaining(1000 * 60 * 2, { converters: ['sec' ]}) // only convert to sec
     *   console.log(value + ' ' + type) // 120 секунд
     *
     * @param ms - Milliseconds to parse from
     * @param options - Convertion options
     * @param options.converters - List of types to convert to. If some time was not specified, e.g. ms, the most
     *   closest type will be used
     * @returns - An object containing the parsed time and the type of time (e.g. "days", "hours", etc.)
     */
    remaining(
      ms: number,
      { converters: converterTypes = ['sec', 'min', 'hour', 'day'] }: { converters?: Time[] } = {},
    ): { value: string; type: string } {
      const converters = converterTypes.map(type => util.ms.converters[type]).sort((a, b) => b.time - a.time)
      for (const { time, friction = 0, plurals } of converters) {
        const value = ms / time
        if (~~value >= 1) {
          // Replace all 234.0 values to 234
          const parsedTime = value
            .toFixed(friction)
            .replace(/(\.[1-9]*)0+$/m, '$1')
            .replace(/\.$/m, '')

          return {
            value: parsedTime,
            type: util.ngettext(Number(parsedTime), plurals),
          }
        }
      }

      return { value: ms.toString(), type: 'миллисекунд' }
    },
    /** Converts provided time to ms depending on the type */
    from(type: Time, num: number) {
      return this.converters[type].time * num
    },
    converters: {
      ms: {
        time: 1,
        plurals: ['миллисекунд', 'миллисекунды', 'миллисекунд'],
      },
      sec: {
        time: 1000,
        plurals: ['секунда', 'секунды', 'секунд'],
      },
      min: {
        time: 1000 * 60,
        plurals: ['минуту', 'минуты', 'минут'],
        friction: 1,
      },
      hour: {
        time: 1000 * 60 * 60,
        plurals: ['час', 'часа', 'часов'],
        friction: 1,
      },
      day: {
        time: 1000 * 60 * 60 * 60 * 24,
        plurals: ['день', 'дня', 'дней'],
        friction: 2,
      },
      month: {
        time: 1000 * 60 * 60 * 60 * 24 * 30,
        plurals: ['месяц', 'месяца', 'месяцев'],
        friction: 2,
      },
      year: {
        time: 1000 * 60 * 60 * 60 * 24 * 30 * 12,
        plurals: ['год', 'года', 'лет'],
        friction: 3,
      },
    } as Record<Time, { time: number; friction?: number; plurals: Plurals }>,
  },

  waitEach(c: number) {
    let count = 0
    return async () => {
      count++
      if (count % c === 0) {
        await nextTick
        return count
      }
    }
  },

  benchmark: Object.assign(
    /**
     * It returns a function that when called, returns the time it took to call the function and records result to const
     *
     * @param {string} label - The name of the benchmark.
     * @returns {(label?: string) => number} A function that returns the time it took to run the function.
     */
    function benchmark(label: string, type = 'test'): (label?: string) => number {
      const startTime = Date.now()

      return function end(string) {
        const tookTime = Date.now() - startTime

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

  strikeTest() {
    let start = Date.now()
    /** @param {string} label */
    return (label: string) => {
      const date = Date.now()
      console.log(label, '§e' + (date - start) + 'ms')
      start = date
    }
  },

  isKeyof<O extends Record<string | symbol | number, any>>(str: string | symbol | number, obj: O): str is keyof O {
    return str in obj
  },

  nonNullable<T>(value: T): value is NonNullable<T> {
    return typeof value !== 'undefined' && value !== null
  },

  /**
   * @template T
   * @param {T[]} array
   * @returns {T[]}
   */
  dedupe<T>(array: T[]): T[] {
    return [...new Set(array)]
  },

  /**
   * Creates paginator object for array
   *
   * @template T - Item type
   * @param {T[]} array - Array of items to display
   * @param {number} [perPage] - Items per page
   * @param {number} [startPage] - Page to start from
   * @param {number} [minLength=perPage] - Minimal items count to paginate. If array has less then this count, array is
   *   returned. Default is `perPage`
   */
  paginate<T>(array: T[], perPage: number = 10, startPage: number = 1, minLength: number = perPage) {
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

  /**
   * Adds unread count badge to the string
   *
   * @param {string} string
   * @param {number} number
   * @param {object} [options]
   * @param {boolean} [options.showZero=false] Default is `false`
   * @param {string} [options.color='§f'] Default is `'§f'`
   * @param {boolean} [options.brackets=true] Default is `true`
   * @param {string} [options.bracketColor=color] Default is `color`
   */

  badge(
    string: string,
    number: number,
    {
      showZero = false,
      color = '§f',
      brackets = true,
      bracketColor = color,
    }: { showZero?: boolean; color?: string; brackets?: boolean; bracketColor?: string } = {},
  ) {
    if (!showZero && number === 0) return string

    string += ' '
    if (brackets) string += bracketColor + '('
    string += color
    string += number
    if (brackets) string += bracketColor + ')§r'

    return string
  },

  /**
   * Wraps the line
   *
   * @param {string} string
   * @param {number} maxLength
   */
  wrap(string: string, maxLength: number) {
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
      const line = lines[i]
      const lastLineChar = line?.[line.length - 1]

      if (lastLineChar === '§' || char === '§') {
        // Ignore limit for invisible chars
        lines[i] += char
      } else if ((char + line).replace(/§./g, '').length > maxLength) {
        // Limit exceeded, newline
        char.trim() && lines.push(char)
      } else {
        // No limit, add char to the line
        lines[i] += char
      }
    }

    return lines
  },

  /** @param {string} lore */
  wrapLore(lore: string) {
    let color = '§7'
    return this.wrap(lore, 30).map(e => {
      // Get latest color from the string
      const match = e.match(/^.*(§.)/)
      if (match) color = match[1]
      return '§r' + color + e
    })
  },

  /**
   * Formats big number and adds . separator, e.g. 15000 -> 15.000
   *
   * @param {number} n
   * @returns Formatted string
   */
  numseparate(n: number = 0, separator = '.') {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  },

  /** Replaces each §<color> to its terminal eqiuvalent */
  toTerminalColors(text: string) {
    if (__SERVER__)
      return text.replace(/§(.)/g, (_, a) => this.terminalColors[a] ?? this.terminalColors.r) + this.terminalColors.r

    return text.replace(/§(.)/g, '')
  },
  terminalColors: TerminalColors,
}

export type Paginator = ReturnType<(typeof util)['paginate']>

type Plurals = [string, string, string]

type Time = 'year' | 'month' | 'day' | 'hour' | 'min' | 'sec' | 'ms'
