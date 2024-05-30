import { Player } from '@minecraft/server'
import { CONFIG } from './assets/config'
import { ROLES, getRole } from './roles'
import { util } from './util'

export type Text = string

interface TStatic {
  error: TFn & Omit<TStatic, 'error'>
  header: TFn
  roles: (text: TemplateStringsArray, ...players: Player[]) => Text
  badge: (text: TemplateStringsArray, n: number) => Text
  num: (text: TemplateStringsArray, n: number, plurals: Plurals) => Text
  time: (text: TemplateStringsArray, time: number) => Text
  options: (options: ColorizingOptions) => TStatic
}

type TFn = (text: TemplateStringsArray, ...args: unknown[]) => Text

export function textTable(table: Record<string, unknown>) {
  return Object.entries(table)
    .map(([key, value]) => `§7${key}: ${textUnitColorize(value)}`)
    .join('\n')
}

export const t = createMultiConcat()

function createMultiConcat(options: ColorizingOptions = {}, name?: keyof TStatic) {
  options.textColor ??= '§7'
  const t = createSingleConcat(options)
  t.roles = createSingleConcat({ roles: true, ...options })
  t.header = createSingleConcat({ textColor: '§6', unitColor: '§f§l', ...options })
  t.badge = createBadgeConcat(options)
  t.num = createNumConcat(options)
  t.time = createSingleConcat({ time: true, ...options })

  if (name !== 'error') t.error = createMultiConcat({ textColor: '§c', unitColor: '§f', ...options }, 'error')
  t.options = options => createMultiConcat(options)
  return t
}

function createSingleConcat(
  options?: ColorizingOptions,
  fn = (string: string, arg: unknown, i: number, array: readonly unknown[]) => string + textUnitColorize(arg, options),
) {
  const textColor = options?.textColor ?? '§7'
  return function t(text, ...args) {
    const raw = text.raw.slice()
    if (raw.at(-1) === '') raw.pop()
    return raw.reduce((previous, string, i, arr) => previous + fn(string, args[i], i, args) + textColor, textColor)
  } as TFn & TStatic
}

function createBadgeConcat(options: ColorizingOptions): (text: TemplateStringsArray, n: number) => Text {
  return createSingleConcat(options, (string, arg) => {
    if (typeof arg === 'number') {
      if (arg > 0) return string + '§8(' + '§c' + arg + '§8)'
      return string.trimEnd()
    }
    return string + textUnitColorize(arg)
  })
}

function createNumConcat(
  options: ColorizingOptions,
): (text: TemplateStringsArray, n: number, plurals: Plurals) => Text {
  return createSingleConcat(options, (string, arg, i, arr) => {
    if (isPlurals(arg)) {
      const n = arr[i - 1]
      if (typeof n === 'number') {
        return string + ngettext(n, arg)
      }
    }

    return string + textUnitColorize(arg)
  })
}

function isPlurals(arg: unknown): arg is Plurals {
  return Array.isArray(arg) && typeof arg[0] === 'string' && typeof arg[1] === 'string' && typeof arg[2] === 'string'
}

interface ColorizingOptions {
  unitColor?: string
  textColor?: string
  roles?: boolean
  badge?: boolean
  plurals?: boolean
  time?: boolean
}

export function textUnitColorize(unit: unknown, options: ColorizingOptions = {}) {
  const { unitColor = '§f' } = options
  switch (typeof unit) {
    case 'string':
      return unitColor + unit

    case 'undefined':
      return ''

    case 'object':
      if (unit instanceof Player) {
        if (options.roles) return `${ROLES[getRole(unit.id)]}§r ${unitColor}${unit.name}`
        else return unitColor + unit.name
      } else if (globalThis.Command && unit instanceof Command) {
        return unitColor + CONFIG.commandPrefixes[0] + unit.sys.name
      } else return util.inspect(unit)

    case 'symbol':
    case 'function':
      return '§c<>§r'

    case 'number':
    case 'bigint':
      return '§6' + unit + '§r'

    case 'boolean':
      return unit ? '§fДа' : '§cНет'
  }
}

type Plurals = [one: string, two: string, five: string]

/**
 * Gets plural form based on provided number
 *
 * @param n - Number
 * @param forms - Plurals forms in format `1 секунда 2 секунды 5 секунд`
 * @returns Plural form. Currently only Russian supported
 */
function ngettext(n: number, [one = 'секунда', few = 'секунды', more = 'секунд']: Plurals) {
  if (!Number.isInteger(n)) return more
  return [one, few, more][
    n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
  ]
}
