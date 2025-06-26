import { Player, RawText } from '@minecraft/server'
import { defaultLang, Language } from 'lib/assets/lang'
import { Vec } from 'lib/vector'
import { separateNumberWithDots } from '../util'
import { stringify } from '../utils/inspect'
import { ms } from '../utils/ms'
import { intlRemaining } from './intl'
import { I18nMessage, Message, RawTextArg, ServerSideI18nMessage, SharedI18nMessage } from './message'

export type Text = string | Message
export type MaybeRawText = string | RawText

export declare namespace Text {
  export interface Static<T, Arg> {
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
    hhmmss(time: number): Message | string

    colors: (colors: Partial<Text.Colors>) => Chained<T, Arg>

    currentColors: Text.Colors
  }

  /** "§7Some long text §fwith substring§7 and number §64§7" */
  export type Fn<T, Arg = unknown> = (text: TemplateStringsArray, ...args: Arg[]) => T

  interface Modifiers<T, Arg> {
    /** "§cSome long text §fwith substring§c and number §74§c" */
    error: Fn<T, Arg> & Static<T, Arg>

    /** "§eSome long text §fwith substring§e and number §64§e" */
    warn: Fn<T, Arg> & Static<T, Arg>

    /** "§aSome long text §fwith substring§a and number §64§a" */
    success: Fn<T, Arg> & Static<T, Arg>

    /** "§3Some long text §fwith substring§3 and number §64§3" */
    accent: Fn<T, Arg> & Static<T, Arg>

    /** "§8Some long text §7with substring§8 and number §74§8" */
    disabled: Fn<T, Arg> & Static<T, Arg>

    /** "§r§6Some long text §f§lwith substring§r§6 and number §f4§r§6" */
    header: Fn<T, Arg> & Static<T, Arg>

    /** "Some long text with substring and number 4" */
    nocolor: Fn<T, Arg> & Static<T, Arg>
  }
  export type Chained<T, Arg> = Fn<T, Arg> & Static<T, Arg> & Modifiers<T, Arg>
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

export const noI18n = createStatic(undefined, undefined, colors => {
  return function simpleStr(template, ...args) {
    return Message.concatTemplateStringsArray(defaultLang, template, args, colors)
  }
})

export const i18n = createStatic(undefined, undefined, colors => {
  return function i18n(template, ...args) {
    return new I18nMessage(template, args, colors)
  }
})

export const i18nShared = createStatic<SharedI18nMessage, RawTextArg>(undefined, undefined, colors => {
  return function i18nShared(template, ...args) {
    return new SharedI18nMessage(template, args, colors)
  }
})

export const i18nJoin = createStatic(undefined, undefined, colors => {
  return function i18nJoin(template, ...args) {
    return new Message(template, args, colors)
  }
})

function defaultColors(colors: Partial<Text.Colors> = {}): Required<Text.Colors> {
  return { unit: colors.unit ?? '§f', text: colors.text ?? '§7', num: colors.num ?? '§6' }
}

function createStatic<T = string, Arg = unknown>(
  colors: Partial<Text.Colors> = {},
  modifier = false,
  createFn: FnCreator<T>,
): Text.Chained<T, Arg> {
  const dcolors = defaultColors(colors)
  const fn = createFn(dcolors) as Text.Chained<T, Arg>
  fn.currentColors = dcolors
  fn.time = createTime(dcolors)
  fn.hhmmss = createTimeHHMMSS(dcolors)
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
function createTimeHHMMSS(colors: Text.Colors): Text.Static<never, never>['hhmmss'] {
  return n => {
    const date = new Date(n)
    if (n >= dayMs) {
      return new ServerSideI18nMessage(colors, l => `${intlRemaining(l, n, [ms.converters.day])}, ${date.toHHMMSS()}`)
    } else return date.toHHMMSS()
  }
}

function createTime(colors: Text.Colors): Text.Static<never, never>['time'] {
  return ms => new ServerSideI18nMessage(colors, l => intlRemaining(l, ms))
}

export function textUnitColorize(
  v: unknown,
  { unit, num }: Text.Colors = defaultColors(),
  lang: Language | false,
): string {
  switch (typeof v) {
    case 'string':
      if (v.includes('§l')) return unit + v + '§r'
      return unit + v
    case 'undefined':
      return ''
    case 'object':
      if (v instanceof Message) {
        if (!lang) {
          throw new TypeError(`Text unit colorize cannot translate Message '${v.id}' if no locale was given!`)
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
      return (v ? i18n.nocolor`§fДа` : i18n.nocolor`§cНет`).toString(lang || defaultLang)
  }
}
