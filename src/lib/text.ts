import { Player } from '@minecraft/server'
import { CONFIG } from './assets/config'
import { ROLES, getRole } from './roles'
import { util } from './util'

export type Text = string

type TSA = TemplateStringsArray
type Fn = (text: TSA, ...args: unknown[]) => Text
interface Multi {
  error: Fn & Omit<Multi, 'error'>
  header: Fn
  roles: (text: TSA, ...players: Player[]) => Text
  badge: (text: TSA, n: number) => Text
  num: (text: TSA, n: number, plurals: Plurals) => Text
  time: (text: TSA, time: number) => Text
  options: (options: ColorizingOptions) => Multi
}

export function textTable(table: Record<string, unknown>, join: false): string[]
export function textTable(table: Record<string, unknown>, join?: true): string
export function textTable(table: Record<string, unknown>, join = true): string | string[] {
  const mapped = Object.entries(table).map(([key, value]) => `§7${key}: ${textUnitColorize(value)}`)
  return join ? mapped.join('\n') : mapped
}

export const t = createMulti()

function createMulti(options: ColorizingOptions = {}, name?: keyof Multi) {
  const t = createSingle(options)
  t.roles = createSingle({ roles: true, ...options })
  t.header = createSingle({ textColor: '§6', ...options, unitColor: '§f§l' })
  t.badge = createBadge(options)
  t.num = createNum(options)
  t.time = createSingle(options)

  if (name !== 'error') t.error = createMulti({ textColor: '§c', unitColor: '§f', ...options }, 'error')
  t.options = options => createMulti(options)
  return t
}

function createSingle(
  options?: ColorizingOptions,
  fn = (text: string, unit: unknown, i: number, units: unknown[]) => text + textUnitColorize(unit, options),
) {
  const { textColor } = addDefaultsToOptions(options)

  return function t(text, ...units) {
    const raw = text.raw.slice()
    if (raw.at(-1) === '') raw.pop()
    return raw.reduce((previous, text, i) => previous + fn(text, units[i], i, units) + textColor, textColor)
  } as Fn & Multi
}

function createBadge(options: ColorizingOptions): (text: TSA, n: number) => Text {
  return createSingle(options, (text, unit) => {
    if (typeof unit !== 'number') return text + textUnitColorize(unit)
    if (unit > 0) return `${text}§8(§c${unit}§8)`
    return text.trimEnd()
  })
}

function createNum(options: ColorizingOptions): (text: TSA, n: number, plurals: Plurals) => Text {
  return createSingle(options, (text, unit, i, units) => {
    if (isPlurals(unit)) {
      const n = units[i - 1]
      if (typeof n === 'number') return text + ngettext(n, unit)
    }

    return text + textUnitColorize(unit)
  })
}

function isPlurals(unit: unknown): unit is Plurals {
  return (
    Array.isArray(unit) && typeof unit[0] === 'string' && typeof unit[1] === 'string' && typeof unit[2] === 'string'
  )
}

function addDefaultsToOptions(options: ColorizingOptions = {}): Required<ColorizingOptions> {
  const { unitColor = '§f', textColor = '§7', roles = false } = options
  return { unitColor, textColor, roles }
}

interface ColorizingOptions {
  unitColor?: string
  textColor?: string
  roles?: boolean
}

export function textUnitColorize(unit: unknown, options: ColorizingOptions = {}) {
  const { unitColor } = addDefaultsToOptions(options)
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
      return '§6' + unit

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
