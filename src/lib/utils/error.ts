let s: typeof import('lib/bds/api').sendPacketToStdout | undefined
import('lib/bds/api').then(e => (s = e.sendPacketToStdout))

const stringifyError = Object.assign(
  /**
   * Stringify and show error in console
   *
   * @param t
   * @param options
   * @param options.errorName - Overrides error name
   * @param options.parseOnly - Whenever to log error to console or not.
   */
  function stringify(
    t: { message: string; stack?: string; name?: string } | string,
    { omitStackLines = 0 }: { omitStackLines?: number } = {},
  ) {
    if (typeof t === 'string') {
      t = new Error(t)
      t.name = 'StringError'
    }

    __PRODUCTION__ &&
      s?.('error', {
        name: t.name ?? 'Error',
        stack: t.stack ?? '',
        message: t.message,
      })

    const stack = stringifyError.stack.get(omitStackLines + 1, t.stack)
    const message = stringifyError.message.get(t)
    const name = t.name ?? 'Error'
    const text = `§4${name}: §c${message}\n§f${stack}`

    return text
  },
  {
    /** Checks if provided argument is instanceof Error */
    isError(object: unknown): object is Error {
      return typeof object === 'object' && object !== null && object instanceof Error
    },
    trace(add = 0) {
      return this.stack.get(add + 1).replaceAll('\n', '  ')
    },
    parent(add = 0) {
      return (
        this.stack
          .get(add + 1)
          .split('\n')
          .find(e => !e.includes('native')) ?? ''
      )
    },
    stack: {
      modifiers: [
        [/\\/g, '/'],
        [/<anonymous>/, 'ƒ'],
        [/ƒ \((.+)\)/, 'ƒ $1'],
        [/(.*)\(native\)(.*)/, '§8$1(native)$2§f'],
        [s => (s.includes('lib') ? `§7${s.replace(/§./g, '')}§f` : s)],
        // [s => (s.startsWith('§7') ? s : s.replace(/:(\d+)/, ':§6$1§f'))],
        [/__init \(index\.js:4\)/, ''],
      ] as [RegExp | ((s: string) => string), string?][],

      /** Parses stack */
      get(omitLines = 0, stack?: string): string {
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
          .map(e => e.replace(/\s+at\s/g, '').replace(/\n/g, ''))
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
)

export default stringifyError
