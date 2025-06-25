import { Player, RawMessage, RawText } from '@minecraft/server'
import { Language } from 'lib/assets/lang'
import { Vec } from 'lib/vector'
import { separateNumberWithDots } from '../util'
import { stringify } from '../utils/inspect'
import { ms } from '../utils/ms'
import { intlRemaining } from './intl'
import { I18nMessage, Message, ServerSideI18nMessage } from './message'

export type Text = string | Message
export type MaybeRawText = string | RawText

type TSA = TemplateStringsArray

export declare namespace Text {
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

  /** "§7Some long text §fwith substring§7 and number §64§7" */
  export type Fn<T> = (text: TSA, ...args: unknown[]) => T

  interface Modifiers<T> {
    /** "§cSome long text §fwith substring§c and number §74§c" */
    error: Fn<T> & Static<T>

    /** "§eSome long text §fwith substring§e and number §64§e" */
    warn: Fn<T> & Static<T>

    /** "§aSome long text §fwith substring§a and number §64§a" */
    success: Fn<T> & Static<T>

    /** "§3Some long text §fwith substring§3 and number §64§3" */
    accent: Fn<T> & Static<T>

    /** "§8Some long text §7with substring§8 and number §74§8" */
    disabled: Fn<T> & Static<T>

    /** "§r§6Some long text §f§lwith substring§r§6 and number §f4§r§6" */
    header: Fn<T> & Static<T>

    /** "Some long text with substring and number 4" */
    nocolor: Fn<T> & Static<T>
  }
  export type Chained<T> = Fn<T> & Static<T> & Modifiers<T>
  export interface Colors {
    unit: string
    num: string
    text: string
  }
}

type FnCreator<T> = (colors: Text.Colors) => Text.Fn<T>

export type TextTable = readonly (readonly [Text, unknown])[]

export function textTable(table: TextTable): Message {
  return new ServerSideI18nMessage(defaultColors(), lang => {
    const long = table.length > 5
    return table
      .map(
        ([key, value], i) =>
          `${i % 2 === 0 && long ? '§f' : '§7'}${key.toString(lang)}: ${textUnitColorize(value, undefined, lang)}`,
      )
      .join('\n')
  })
}

export const t = createStatic(undefined, undefined, simpleString)
export const l = createStatic(undefined, undefined, simpleString) as Omit<Text.Chained<string>, 'shared' | 'rp'> &
  Text.Fn<string>

export const i18n = createStatic(undefined, undefined, colors => {
  return function i18n(template, ...args) {
    return new I18nMessage(template, args, colors)
  }
})

export const tm = createStatic(undefined, undefined, colors => {
  return function tm(template, ...args) {
    return new Message(template, args, colors)
  }
})

function simpleString(colors: Text.Colors) {
  return function simpleStr(template, ...args) {
    return Message.string(Language.ru_RU, template, args, colors)
  } as Text.Chained<string>
}

function defaultColors(colors: Partial<Text.Colors> = {}): Required<Text.Colors> {
  return { unit: colors.unit ?? '§f', text: colors.text ?? '§7', num: colors.num ?? '§6' }
}

function createStyle(colors: Text.Colors) {
  return Object.freeze(colors)
}

const styles = {
  nocolor: createStyle({ text: '', unit: '', num: '' }),
  header: createStyle({ text: '§r§6', num: '§f', unit: '§f§l' }),
  error: createStyle({ num: '§7', text: '§c', unit: '§f' }),
  warn: createStyle({ num: '§6', text: '§e', unit: '§f' }),
  accent: createStyle({ num: '§6', text: '§3', unit: '§f' }),
  success: createStyle({ num: '§6', text: '§a', unit: '§f' }),
  disabled: createStyle({ num: '§7', text: '§8', unit: '§7' }),
}

function createStatic<T = string>(
  colors: Partial<Text.Colors> = {},
  modifier = false,
  createFn: FnCreator<T>,
): Text.Chained<T> {
  const dcolors = defaultColors(colors)
  const fn = createFn(dcolors) as Text.Chained<T>
  fn.shared = fn
  fn.rp = fn
  fn.currentColors = dcolors
  fn.raw = createRaw(dcolors)
  fn.time = createTime(dcolors)
  fn.timeHHMMSS = createTimeHHMMSS(dcolors)
  fn.size = createSizePostfixer(dcolors)
  fn.badge = createSizePostfixer({ ...dcolors, num: '§c', text: '§4' })
  fn.colors = colors => createStatic<T>(colors, false, createFn)

  if (!modifier) {
    fn.nocolor = createStatic(styles.nocolor, true, createFn)
    fn.header = createStatic(styles.header, true, createFn)
    fn.error = createStatic(styles.error, true, createFn)
    fn.warn = createStatic(styles.warn, true, createFn)
    fn.accent = createStatic(styles.accent, true, createFn)
    fn.success = createStatic(styles.success, true, createFn)
    fn.disabled = createStatic(styles.disabled, true, createFn)
  }
  return fn
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

        const vstring = v.toString(lang)
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
