import { Player, RawMessage, RawText } from '@minecraft/server'
import { Command } from './command'
import { ROLES, getRole } from './roles'
import { separateNumberWithDots } from './util'
import { stringify } from './utils/inspect'
import { ms } from './utils/ms'

export type Text = string
export type MaybeRawText = string | RawText

type TSA = TemplateStringsArray
type Fn = (text: TSA, ...args: unknown[]) => Text
type OptionsModifiers = 'error' | 'header'
interface MultiStatic {
  raw: (text: TSA, ...units: (string | RawText | RawMessage)[]) => RawText
  roles: (text: TSA, ...players: Player[]) => Text
  badge: (text: TSA, n: number) => Text
  num: (text: TSA, n: number, plurals: Plurals) => Text
  time: (text: TSA, time: number) => Text
  ttime: (time: number) => Text
  options: (options: ColorizingOptions) => Multi
}
type Multi = MultiStatic & Record<OptionsModifiers, Fn & Omit<MultiStatic, OptionsModifiers>>

export function textTable(table: Record<string, unknown>, join: false): string[]
export function textTable(table: Record<string, unknown>, join?: true): string
export function textTable(table: Record<string, unknown>, join = true): string | string[] {
  const mapped = Object.entries(table).map(([key, value]) => `§7${key}: ${textUnitColorize(value)}`)
  return join ? mapped.join('\n') : mapped
}

export const t = createGroup()

function createGroup(options: ColorizingOptions = {}, modifier = false) {
  const t = createSingle(options)
  t.roles = createSingle({ roles: true, ...options })
  t.badge = createBadge(options)
  t.num = createNum(options)
  t.time = createTime(options)
  t.ttime = time => t.time`${time}`
  t.raw = createRaw(options)

  if (!modifier) {
    t.header = createGroup({ text: '§6', ...options, unit: '§f§l' }, true)
    t.error = createGroup({ text: '§c', unit: '§f', ...options }, true)
  }
  t.options = options => createGroup(options)
  return t
}

function createRaw(options: ColorizingOptions): (text: TSA, ...units: (string | RawText)[]) => RawText {
  options = addDefaultsToOptions(options)
  return (text, ...units) => {
    const texts = text.slice()
    const raw: RawText = { rawtext: [{ text: options.text }] }

    for (const [i, t] of texts.entries()) {
      const unit = units[i] as string | RawText | undefined | null

      raw.rawtext?.push({ text: t })
      if (unit === '' || unit === undefined || unit === null) continue
      else if (typeof unit === 'string') {
        if (unit !== '') raw.rawtext?.push({ text: textUnitColorize(unit, options) })
      } else {
        raw.rawtext?.push({ text: options.unit })
        if (Array.isArray(unit.rawtext)) {
          raw.rawtext?.push(...unit.rawtext)
        } else {
          raw.rawtext?.push(unit)
        }
        raw.rawtext?.push({ text: options.text })
      }
    }

    return raw
  }
}

function createSingle(
  options?: ColorizingOptions,
  fn = (text: string, unit: unknown, i: number, units: unknown[]) => text + textUnitColorize(unit, options),
) {
  const { text: textColor } = addDefaultsToOptions(options)

  return function t(text, ...units) {
    const raw = text.slice()
    if (raw.at(-1) === '') raw.pop()
    return raw.reduce((previous, text, i) => previous + fn(text, units[i], i, units) + textColor, textColor)
  } as Fn & Multi
}

function createBadge(options: ColorizingOptions): (text: TSA, n: number) => Text {
  return createSingle(options, (text, unit) => {
    if (typeof unit !== 'number') return text + textUnitColorize(unit, options)
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

    return text + textUnitColorize(unit, options)
  })
}

function createTime(options: ColorizingOptions): (text: TSA, time: number) => Text {
  return createSingle(options, (text, unit) => {
    if (typeof unit !== 'number') return text + textUnitColorize(unit, options)

    const time = ms.remaining(unit)
    return text + `${textUnitColorize(time.value, options)} ${addDefaultsToOptions(options).text}${time.type}`
  })
}

function isPlurals(unit: unknown): unit is Plurals {
  return (
    Array.isArray(unit) && typeof unit[0] === 'string' && typeof unit[1] === 'string' && typeof unit[2] === 'string'
  )
}

function addDefaultsToOptions(options: ColorizingOptions = {}): Required<ColorizingOptions> {
  const { unit: unitColor = '§f', text: textColor = '§7', roles = false } = options
  return { unit: unitColor, text: textColor, roles }
}

interface ColorizingOptions {
  unit?: string
  text?: string
  roles?: boolean
}

export function textUnitColorize(unit: unknown, options: ColorizingOptions = {}) {
  const { unit: unitColor } = addDefaultsToOptions(options)
  switch (typeof unit) {
    case 'string':
      return unitColor + unit

    case 'undefined':
      return ''

    case 'object':
      if (unit instanceof Player) {
        if (options.roles) return `${ROLES[getRole(unit.id)]}§r ${unitColor}${unit.name}`
        else return unitColor + unit.name
      } else if (unit instanceof Command) {
        return unitColor + Command.prefixes[0] + unit.sys.name
      } else return stringify(unit)

    case 'symbol':
    case 'function':
      return '§c<>§r'

    case 'number':
      return `§6${separateNumberWithDots(unit)}`
    case 'bigint':
      return `§6${unit}`

    case 'boolean':
      return unit ? '§fДа' : '§cНет'
  }
}

export type Plurals = [one: string, two: string, five: string]

/**
 * Gets plural form based on provided number
 *
 * @param n - Number
 * @param forms - Plurals forms in format `1 секунда 2 секунды 5 секунд`
 * @returns Plural form. Currently only Russian supported
 */
export function ngettext(n: number, [one = 'секунда', few = 'секунды', more = 'секунд']: Plurals) {
  if (!Number.isInteger(n)) return more
  return [one, few, more][
    n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
  ]
}
