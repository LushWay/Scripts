import { Player, RawMessage, RawText } from '@minecraft/server'
import { Command } from './command'
import { ROLES, getRole } from './roles'
import { separateNumberWithDots } from './util'
import { stringify } from './utils/inspect'
import { ms } from './utils/ms'
import { Plurals, ngettext } from './utils/ngettext'

export type Text = string
export type MaybeRawText = string | RawText

type TSA = TemplateStringsArray
type Fn = (text: TSA, ...args: unknown[]) => Text
type OptionsModifiers = 'error' | 'warn' | 'header'
interface MultiStatic {
  raw: (text: TSA, ...units: (string | RawText | RawMessage)[]) => RawText
  roles: (text: TSA, ...players: Player[]) => Text
  badge: (text: TSA, n: number) => Text
  num: (text: TSA, n: number, plurals: Plurals) => Text

  time(time: number): Text
  time(text: TSA, time: number): Text

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
  t.time = createOverload(createTime(options), (t, time: number) => t`${time}`)
  t.raw = createRaw(options)

  if (!modifier) {
    t.header = createGroup({ text: '§6', ...options, unit: '§f§l' }, true)
    t.error = createGroup({ text: '§c', unit: '§f', ...options }, true)
    t.warn = createGroup({ text: '§e', unit: '§f', ...options }, true)
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

function createOverload<T extends (text: TSA, ...args: any[]) => Text, O extends (t: T, ...args: any[]) => Text>(
  tsa: T,
  overload: O,
) {
  return (...args: unknown[]) => {
    if (isTSA(args[0])) return tsa(args[0], ...args.slice(1))
    else return overload(tsa, ...args)
  }
}

function isTSA(arg: unknown): arg is TemplateStringsArray {
  return Array.isArray(arg) && 'raw' in arg
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
