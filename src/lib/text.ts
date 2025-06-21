import { Player, RawMessage, RawText } from '@minecraft/server'
import { Vec } from 'lib/vector'
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

  /**
   * @example
   *   t.badge`Some text ${3}` -> Some text (3)
   */
  unreadBadge: (text: TSA, n: number) => Text

  /**
   * @example
   *   t.size(3) -> ' (3)', t.size(0) -> ''
   */
  size: (n: number) => Text

  /**
   * @example
   *   t.num`Было сломано ${n} ${['блок', 'блока', 'блоков']}` -> "Было сломано 10 блоков"
   */
  num: (text: TSA, n: number, plurals: Plurals) => Text

  /**
   * @example
   *   t.time(3000) -> "3 секунды"
   */
  time(time: number): Text
  /**
   * @example
   *   t.time`Прошло ${3000}` -> "Прошло 3 секунды"
   */
  time(text: TSA, time: number): Text

  /**
   * @example
   *   t.time(3000) -> "00:00:03"
   *   t.time(ms.from('min', 32) + 1000) -> "00:32:01"
   *   t.time(ms.from('day', 1) +  ms.from('min', 32) + 1000) -> "1 день, 00:32:01"
   *   t.time(ms.from('day', 10000) +  ms.from('min', 32) + 1000) -> "10000 дней, 00:32:01"
   */
  timeHHMMSS(time: number): Text

  options: (options: ColorOptions) => Multi & Fn
}

export declare namespace Text {
  export type Function = Fn
  export type Optiosn = ColorOptions
  export type Static = Multi
}

type Multi = MultiStatic & Record<OptionsModifiers, Fn & Omit<MultiStatic, OptionsModifiers>>

export function textTable(table: Record<string, unknown>, join: false, twoColors?: boolean): string[]
export function textTable(table: Record<string, unknown>, join?: true, twoColors?: boolean): string
export function textTable(table: Record<string, unknown>, join = true, twoColors = true): string | string[] {
  const long = Object.keys(table).length > 5 && twoColors
  const mapped = Object.entries(table).map(
    ([key, value], i) => `${long && i % 2 === 0 ? '§f' : '§7'}${key}: ${textUnitColorize(value)}`,
  )
  return join ? mapped.join('\n') : mapped
}

export const t = createGroup()

function createGroup(options: ColorOptions = {}, modifier = false) {
  const t = createSingle(options)
  t.roles = createSingle({ roles: true, ...options })
  t.unreadBadge = createBadge(options)
  t.num = createNum(options)
  t.time = createOverload(createTime(options), (t, time: number) => t`${time}`)
  t.raw = createRaw(options)
  t.timeHHMMSS = createRemaining(options)
  t.size = createSize(t)

  if (!modifier) {
    t.header = createGroup({ text: '§6', ...options, unit: '§f§l' }, true)
    t.error = createGroup({ ...options, text: '§c', unit: '§f', num: '§7' }, true)
    t.warn = createGroup({ ...options, text: '§e', unit: '§f' }, true)
  }
  t.options = options => createGroup(options)
  return t
}

const dayMs = ms.from('day', 1)
function createRemaining(options: ColorOptions): MultiStatic['timeHHMMSS'] {
  const { text, num } = addDefaultsToOptions(options)
  return n => {
    const date = new Date(n)
    if (n >= dayMs) {
      const rem = ms.remaining(n, { converters: ['day'], friction: 0 })
      return `${num}${rem.value} ${text}${rem.type}, ${num}${date.toHHMMSS()}${text}`
    }
    return num + date.toHHMMSS() + text
  }
}

function createSize(t: Fn): MultiStatic['size'] {
  return s => {
    if (s === 0) return ''
    return t` (${s})`
  }
}

function createRaw(options: ColorOptions): (text: TSA, ...units: (string | RawText)[]) => RawText {
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
  options?: ColorOptions,
  fn = (text: string, unit: unknown, i: number, units: unknown[]) => text + textUnitColorize(unit, options),
) {
  const { text: textColor } = addDefaultsToOptions(options)

  return function t(text, ...units) {
    const raw = text.slice()
    if (raw.at(-1) === '') raw.pop()
    return raw.reduce((previous, text, i) => previous + fn(text, units[i], i, units) + textColor, textColor)
  } as Fn & Multi
}

function createBadge(options: ColorOptions): (text: TSA, n: number) => Text {
  return createSingle(options, (text, unit) => {
    if (typeof unit !== 'number') return text + textUnitColorize(unit, options)
    if (unit > 0) return `${text}§7(${options.num ?? '§c'}${unit}§7)`
    return text.trimEnd()
  })
}

function createNum(options: ColorOptions): (text: TSA, n: number, plurals: Plurals) => Text {
  return createSingle(options, (text, unit, i, units) => {
    if (isPlurals(unit)) {
      const n = units[i - 1]
      if (typeof n === 'number') return text + ngettext(n, unit)
    }

    return text + textUnitColorize(unit, options)
  })
}

function createOverload<T extends (text: TSA, ...args: any[]) => Text>(
  tsa: T,
  overload: (t: T, ...args: any[]) => Text,
) {
  return (...args: unknown[]) => {
    if (isTSA(args[0])) return tsa(args[0], ...args.slice(1))
    else return overload(tsa, ...args)
  }
}

function isTSA(arg: unknown): arg is TemplateStringsArray {
  return Array.isArray(arg) && 'raw' in arg
}

function createTime(options: ColorOptions): (text: TSA, time: number) => Text {
  const { text } = addDefaultsToOptions(options)
  return createSingle(options, (prev, unit) => {
    if (typeof unit !== 'number') return prev + textUnitColorize(unit, options)

    const time = ms.remaining(unit)
    return prev + `${textUnitColorize(time.value, options)} ${text}${time.type}`
  })
}

function isPlurals(unit: unknown): unit is Plurals {
  return (
    Array.isArray(unit) && typeof unit[0] === 'string' && typeof unit[1] === 'string' && typeof unit[2] === 'string'
  )
}

function addDefaultsToOptions(options: ColorOptions = {}): Required<ColorOptions> {
  const { unit = '§f', text = '§7', num = '§6', roles = false } = options
  return { unit, text, roles, num }
}

export interface ColorOptions {
  unit?: string
  num?: string
  text?: string
  roles?: boolean
}

export function textUnitColorize(unit: unknown, options: ColorOptions = {}) {
  const { unit: unitColor, num } = addDefaultsToOptions(options)
  switch (typeof unit) {
    case 'string':
      return unitColor + unit

    case 'undefined':
      return ''

    case 'object':
      if (unit instanceof Player) {
        if (options.roles) return `${ROLES[getRole(unit.id)]}§r ${unitColor}${unit.name}`
        else return unitColor + unit.name
      } else if (Vec.isVec(unit)) {
        return Vec.string(unit, true)
      } else return stringify(unit)

    case 'symbol':
    case 'function':
    case 'bigint':
      return '§c<>§r'

    case 'number':
      return `${num}${separateNumberWithDots(unit)}`

    case 'boolean':
      return unit ? '§fДа' : '§cНет'
  }
}
