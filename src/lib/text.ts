import { Player, RawMessage, RawText } from '@minecraft/server'
import { Vec } from 'lib/vector'
import { separateNumberWithDots } from './util'
import { stringify } from './utils/inspect'
import { ms } from './utils/ms'

export type Text = string
export type MaybeRawText = string | RawText

type TSA = TemplateStringsArray
type Fn = (text: TSA, ...args: unknown[]) => Text
type OptionsModifiers = 'error' | 'warn' | 'header'
interface MultiStatic {
  raw: (text: TSA, ...units: (string | RawText | RawMessage)[]) => RawText

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
   *   t.time(3000) -> "3 секунды"
   */
  time(time: number): Text

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
export const l = createGroup()

function createGroup(options: ColorOptions = {}, modifier = false) {
  const t = createSingle(options)
  t.unreadBadge = createBadge(options)
  t.time = createTime(options)
  t.raw = createRaw(options)
  t.timeHHMMSS = createTimeHHMMSS(options)
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
function createTimeHHMMSS(options: ColorOptions): MultiStatic['timeHHMMSS'] {
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

function createTime(options: ColorOptions): (timen: number) => Text {
  const { text } = addDefaultsToOptions(options)
  return timen => {
    const time = ms.remaining(timen)
    return `${textUnitColorize(time.value, options)} ${text}${time.type}`
  }
}

function addDefaultsToOptions(options: ColorOptions = {}): Required<ColorOptions> {
  const { unit = '§f', text = '§7', num = '§6' } = options
  return { unit, text, num }
}

export interface ColorOptions {
  unit?: string
  num?: string
  text?: string
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
        return unitColor + unit.name
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
