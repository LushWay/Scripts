import { Player, RawMessage, RawText } from '@minecraft/server'
import { Language } from 'lib/assets/lang'
import { Vec } from 'lib/vector'
import { separateNumberWithDots } from '../util'
import { stringify } from '../utils/inspect'
import { ms } from '../utils/ms'
import { intlRemaining } from './intl'
import { I18nMessage, Message, ServerSideI18nMessage } from './message'

export type Text = string
export type MaybeRawText = string | RawText

type TSA = TemplateStringsArray

export declare namespace Text {
  export type Msg = string | Message

  export type RawTextArg = string | RawText | RawMessage | Message | undefined | null

  export interface Static<T> {
    raw: (text: TSA, ...units: RawTextArg[]) => RawText

    /**
     * @example
     *   t.badge(3) -> '§4 (§c3§4)' // §r
     *   t.badge(0) -> ''
     */
    badge: (n: number | undefined) => string

    /**
     * @example
     *   t.size(3) -> '§7 (§f3§7)' // §r
     *   t.size(0) -> ''
     */
    size: (n: number | undefined) => string

    /**
     * @example
     *   t.time(3000) -> "3 секунды"
     */
    time(time: number): Message

    /**
     * @example
     *   t.time(3000) -> "00:00:03"
     *   t.time(ms.from('min', 32) + 1000) -> "00:32:01"
     *   t.time(ms.from('day', 1) +  ms.from('min', 32) + 1000) -> "1 день, 00:32:01"
     *   t.time(ms.from('day', 10000) +  ms.from('min', 32) + 1000) -> "10000 дней, 00:32:01"
     */
    timeHHMMSS(time: number): Message | string

    colors: (colors: Partial<Text.Colors>) => Chained<T>

    currentColors: Text.Colors

    /**
     * No runtime effect. Affects only messages extraction, making this message available for both site and resource
     * pack
     */
    shared: Static<T>

    /** No runtime effect. Affects only messages extraction, making this message available for resource pack */
    rp: Static<T>
  }

  export type Fn<T = string> = (text: TSA, ...args: unknown[]) => T

  type Modifiers = 'error' | 'warn' | 'header' | 'accent' | 'nocolor'
  export type Chained<T> = Fn<T> & Static<T> & Record<Modifiers, Fn<T> & Static<T>>
  export interface Colors {
    unit: string
    num: string
    text: string
  }
}

type FnCreator<T> = (colors: Text.Colors) => Text.Fn<T>

export type TextTable = readonly (readonly [string, unknown])[]

export function textTable(table: TextTable, join: false, twoColors?: boolean): string[]
export function textTable(table: TextTable, join?: true, twoColors?: boolean): string
export function textTable(table: TextTable, join = true, twoColors = true): string | string[] {
  const long = table.length > 5 && twoColors
  const mapped = table.map(
    ([key, value], i) => `${i % 2 === 0 && long ? '§f' : '§7'}${key}: ${textUnitColorize(value, undefined, false)}`,
  )
  return join ? mapped.join('\n') : mapped
}

export const t = createStatic(undefined, undefined, simpleToString)
export const l = createStatic(undefined, undefined, simpleToString) as Omit<Text.Chained<string>, 'shared' | 'rp'>

export const i18n = createStatic(undefined, undefined, colors => {
  return function i18n(template, ...args) {
    return new I18nMessage(template, args, colors)
  }
})

function simpleToString(colors: Text.Colors) {
  const { text: textColor } = colors
  return function t(text, ...units) {
    const raw = text.slice()
    if (raw.at(-1) === '') raw.pop()
    return raw.reduce(
      (previous, templateText, i) =>
        previous + templateText + textUnitColorize(units[i], colors, Language.ru_RU) + textColor,
      textColor,
    )
  } as Text.Chained<string>
}

function defaultColors(colors: Partial<Text.Colors> = {}): Required<Text.Colors> {
  const { unit = '§f', text = '§7', num = '§6' } = colors
  return { unit, text, num }
}

function createStatic<T = string>(
  colors: Partial<Text.Colors> = {},
  modifier = false,
  creator: FnCreator<T>,
): Text.Chained<T> {
  const dcolors = defaultColors(colors)
  const t = creator(dcolors) as Text.Chained<T>
  t.shared = t
  t.rp = t
  t.currentColors = dcolors
  t.raw = createRaw(dcolors)
  t.time = createTime(dcolors)
  t.timeHHMMSS = createTimeHHMMSS(dcolors)
  t.size = createSizePostfixer(dcolors)
  t.badge = createSizePostfixer({ ...dcolors, num: '§c', text: '§4' })
  t.colors = colors => createStatic<T>(colors, false, creator)

  if (!modifier) {
    t.nocolor = createStatic({ text: '', unit: '', num: '' }, true, creator)
    t.header = createStatic({ text: '§r§6', num: '§f', unit: '§f§l' }, true, creator)
    t.error = createStatic({ num: '§7', text: '§c', unit: '§f' }, true, creator)
    t.warn = createStatic({ ...colors, text: '§e', unit: '§f' }, true, creator)
    t.accent = createStatic({ ...colors, text: '§3', unit: '§f' }, true, creator)
  }
  return t
}

const dayMs = ms.from('day', 1)
function createTimeHHMMSS(colors: Text.Colors): Text.Static<unknown>['timeHHMMSS'] {
  return n => {
    const date = new Date(n)
    if (n >= dayMs) {
      return new ServerSideI18nMessage(colors, l => `${intlRemaining(l, n, [ms.converters.day])}, ${date.toHHMMSS()}`)
    } else return date.toHHMMSS()
  }
}

export function createSizePostfixer(colors: Text.Colors): Text.Static<unknown>['size'] {
  return s => {
    if (!s) return ''
    return `${colors.text} (${colors.num}${s}${colors.text})`
  }
}

// TODO Migrate to never use it
function createRaw(colors: Text.Colors): Text.Static<unknown>['raw'] {
  return (text, ...units) => {
    const texts = text.slice()
    const raw: RawText = { rawtext: [{ text: colors.text }] }

    for (const [i, t] of texts.entries()) {
      const unit = units[i] as string | RawText | undefined | null

      raw.rawtext?.push({ text: t })
      if (unit === '' || unit === undefined || unit === null) continue
      else if (typeof unit === 'string') {
        if (unit !== '') raw.rawtext?.push({ text: textUnitColorize(unit, colors, false) })
      } else {
        raw.rawtext?.push({ text: colors.unit })
        if (Array.isArray(unit.rawtext)) {
          raw.rawtext?.push(...unit.rawtext)
        } else {
          raw.rawtext?.push(unit)
        }
        raw.rawtext?.push({ text: colors.text })
      }
    }

    return raw
  }
}

function createTime(colors: Text.Colors): Text.Static<Message>['time'] {
  return ms => new ServerSideI18nMessage(colors, l => intlRemaining(l, ms))
}

export function textUnitColorize(
  v: unknown,
  { unit, num }: Text.Colors = defaultColors(),
  lang: Language | false,
): string {
  switch (typeof v) {
    case 'string':
      return unit + v
    case 'undefined':
      return ''
    case 'object':
      if (v instanceof I18nMessage) {
        if (!lang) {
          throw new TypeError(`Text unit colorize cannot translate I18nMessage '${v.id}' if no locale was given!`)
        }

        const vstring = v.string(lang)
        return vstring.startsWith('§') ? vstring : unit + vstring
      }
      if (v instanceof Player) {
        return unit + v.name
      } else if (Vec.isVec(v)) {
        return Vec.string(v, true)
      } else return stringify(v)

    case 'number':
      return `${num}${separateNumberWithDots(v)}`
    case 'symbol':
    case 'function':
    case 'bigint':
      return '§c<>'
    case 'boolean':
      return v ? t.nocolor`§fДа` : t.nocolor`§cНет`
  }
}
