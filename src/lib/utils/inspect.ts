import stringifyError from './error'

export function stringify(target: unknown) {
  if (typeof target === 'string') return target
  if (
    target &&
    typeof target === 'object' &&
    stringifySymbol in target &&
    typeof target[stringifySymbol] === 'function'
  ) {
    try {
      const result = (target[stringifySymbol] as () => unknown)()
      if (typeof result === 'string') return result
    } catch {
      return inspect(target)
    }
  }
  if (stringifyError.isError(target)) return stringifyError(target)
  return inspect(target)
}

export const stringifySymbol = Symbol('stringify')

export function inspect(target: unknown, space = '  ', cw = '', funcCode = false, depth = 0) {
  const c = {
    function: {
      function: '§5',
      name: '§d',
      arguments: '§f',
      code: '§8',
      brackets: '§7',
    },

    nonstring: '§6',
    undefined: '§7',
    symbol: '§2',
    string: '§2',
  }

  const uniqueKey = Date.now().toString()

  // avoid Circular structure error
  const visited = new WeakSet()

  if (depth > 10 || typeof target !== 'object') return `${rep(target)}` || `${target}` || '{}'

  function rep(value: unknown) {
    if (typeof value === 'object' && value !== null) {
      if (visited.has(value)) {
        // Circular structure detected
        return '§b<ref *>§r'
      } else {
        try {
          visited.add(value)
        } catch (e) {}
      }
    }

    switch (typeof value) {
      case 'function': {
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

          const match = /(\w*)\(/.exec(r)?.[1]
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
          r = isArrow ? '' : `${cl.function} ƒ `
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
        if (value === null) return 'null'

        const allInherits: JsonObject = {}

        for (const key in value)
          try {
            // value[key] can be ungettable
            allInherits[key] = (value as JsonObject)[key]
          } catch (e) {}

        value = allInherits
        break
      }
      case 'symbol':
        value = `${c.symbol}Symbol(${value.description})§r`
        break

      case 'string':
        value = `${c.string}\`${value.replace(/"/g, uniqueKey).replace(/§/g, '$')}\`§r`
        break

      case 'undefined':
        value = `${c.undefined}${value}§r`
        break

      default:
        value = `${c.nonstring}${value}§r`
        break
    }
    return value
  }

  return JSON.stringify(target, (_, value) => rep(value), space)
    .replace(/"/g, cw)
    .replace(new RegExp(uniqueKey, 'g'), '"')
    .slice(0, 1000)
}
