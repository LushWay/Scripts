import { TerminalColors } from './Assets/terminal-colors.js'

// eslint-disable-next-line @typescript-eslint/naming-convention
export const util = {
  settings: {
    BDSMode: true,
    firstLoad: false,
  },
  error: Object.assign(
    /**
     * Stringify and show error in console
     * @param {{ message: string; stack?: string; name?: string } | string } error
     * @param {object} [options]
     * @param {number} [options.omitStackLines]
     * @param {string} [options.errorName] - Overrides error name
     * @param {boolean} [options.parseOnly] - Whenever to log error to console or not.
     * @param {string} [options.subtype]
     */
    function error(error, { omitStackLines = 0, errorName, parseOnly, subtype } = {}) {
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
      stack: {
        /** @type {[RegExp | ((s: string) => string), string?][]} */
        modifiers: [
          [/\\/g, '/'],
          [/<anonymous>/, 'ƒ'],
          [/ƒ \((.+)\)/, 'ƒ $1'],
          [/(.*)\(native\)(.*)/, '§8$1(native)$2§f'],
          [s => (s.includes('lib') ? `§7${s.replace(/§./g, '')}§f` : s)],
          [s => (s.startsWith('§7') ? s : s.replace(/\.js:(\d+)/, '.js:§6$1§f'))],
        ],

        /**
         * Parses stack
         * @param {number} omitLines
         * @param {string} [stack]
         * @returns {string}
         */
        get(omitLines = 0, stack) {
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
        /** @type {[RegExp | string, string, string?][]} */
        modifiers: [
          // [/\n/g, ''],
          [/Module \[(.*)\] not found\. Native module error or file not found\./g, '§cNot found: §6$1', 'LoadError'],
        ],

        /**
         * @param {{ message?: string, name?: string }} error
         */
        get(error) {
          let message = error.message ?? ''
          for (const [find, replace, newname] of this.modifiers) {
            const newmessage = message.replace(find, replace)
            if (newmessage !== message && newname) error.name = newname
            message = newmessage
          }

          return message
        },
      },
    }
  ),

  /**
   * @param {any} target
   */
  stringify(target) {
    if (typeof target === 'string') return target
    return this.inspect(target)
  },

  /**
   * @param {any} target
   */
  inspect(target, space = '  ', cw = '', funcCode = false, depth = 0) {
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

    /**
     * @param {any} value
     */
    function rep(value) {
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
          /**
           * @type {string}
           */
          let r = value.toString().replace(/[\n\r]/g, '')

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
          const allInherits = {}

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
   * Runs given function safly. If it throws synhronous error it will be catched and returned as
   * second element in the array
   * @template {() => any} T
   * @param {T} fn
   * @returns {[ result: ReturnType<T>, error: undefined ] |
   *           [ result: undefined, error: unknown ] }
   */
  run(fn) {
    try {
      return [fn(), void 0]
    } catch (error) {
      return [void 0, error]
    }
  },

  /**
   * Runs the given callback safly. If it throws any error it will be handled
   * @param {() => void | Promise<void>} fn
   * @param {string} [subtype]
   */
  catch(fn, subtype = 'Handled') {
    try {
      const promise = fn()
      if (promise instanceof Promise) promise.catch(e => this.error(e, { omitStackLines: 1, subtype }))
    } catch (e) {
      this.error(e, { omitStackLines: 1, subtype })
    }
  },

  /**
   * @typedef {[string, string, string]} Plurals
   */

  /**
   * Gets plural form based on provided number
   * @param {number} n - Number
   * @param {Plurals} forms - Plurals forms in format `1 секунда 2 секунды 5 секунд`
   * @returns Plural form. Currently only Russian supported
   */
  ngettext(n, [one = 'секунда', few = 'секунды', more = 'секунд']) {
    if (!Number.isInteger(n)) return more
    return [one, few, more][
      n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
    ]
  },

  /**
   * @typedef {'year' | 'month' | 'day' | 'hour' | 'min' | 'sec' | 'ms'} Time
   */

  ms: {
    /**
     * Parses the remaining time in milliseconds into a more human-readable format
     * @param {number} ms - Milliseconds to parse
     * @param {object} [options]
     * @param {Time[]} [options.converters]
     * @returns {{ value: string, type: string }} - An object containing the parsed time and the type of time (e.g. "days", "hours", etc.)
     */
    remaining(ms, { converters: converterTypes = ['sec', 'min', 'hour', 'day'] } = {}) {
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
    /**
     * Converts provided time to ms depending on type
     * @param {Time} type
     * @param {number} num
     */
    from(type, num) {
      return this.converters[type].time * num
    },
    /**
     * @type {Record<Time, {time: number, friction?: number, plurals: Plurals}>}
     */
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
    },
  },

  /**
   *
   * @param {number} c
   */
  waitEach(c) {
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
     * @param {string} label - The name of the benchmark.
     * @returns {(label?: string) => number} A function that returns the time it took to run the function.
     */
    function benchmark(label, type = 'test') {
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
      /** @type {Record<string, Record<string, number>>} */
      results: {},
    }
  ),

  strikeTest() {
    let start = Date.now()
    /**
     * @param {string} label
     */
    return label => {
      const date = Date.now()
      console.log(label, '§e' + (date - start) + 'ms')
      start = date
    }
  },

  /**
   * @param {string | symbol | number} str
   * @template {Record<string | symbol | number, any>} O
   * @param {O} obj
   * @returns {str is keyof O}
   */
  isKeyof(str, obj) {
    return str in obj
  },

  /**
   * @template T
   * @param {T[]} array
   * @returns {T[]}
   */
  dedupe(array) {
    return [...new Set(array)]
  },

  /**
   * Replaces each §<color> to its terminal eqiuvalent
   * @param {string} text
   */
  toTerminalColors(text) {
    if (this.settings.BDSMode)
      return text.replace(/§(.)/g, (_, a) => this.terminalColors[a] ?? this.terminalColors.r) + this.terminalColors.r

    return text.replace(/§(.)/g, '')
  },
  /**
   * @type {Record<string, string>}
   */
  terminalColors: TerminalColors,
}
