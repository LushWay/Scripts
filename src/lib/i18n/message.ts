import { RawMessage, RawText } from '@minecraft/server'
import { defaultLang, Language } from 'lib/assets/lang'
import {
  extractedSharedMessagesIds,
  extractedTranslatedMessages,
  extractedTranslatedPlurals,
} from 'lib/assets/lang-messages'
import { intlPlural } from 'lib/i18n/intl'
import { rawTextToString } from './lang'
import { textUnitColorize } from './text'

export type RawTextArg = number | boolean | string | RawText | SharedI18nMessage | undefined | null

interface Preprocessed {
  s: string[]
  i: number[]
}

export class Message {
  readonly id: string

  constructor(
    protected readonly template: readonly string[],
    protected readonly args: readonly unknown[],
    protected colors: Text.Colors,
  ) {
    this.id = template.join('\x00')
  }

  color(c: Text.Colors | Pick<Text.Static<never>, 'style'>, children = true) {
    const were = this.colors

    this.colors = 'style' in c ? c.style : c
    for (const arg of this.args) {
      if (arg instanceof Message) {
        // Recolor children only if they had the same colors parent had
        // Or if force recoloring is enabled
        if (arg.colors === were || children) arg.color(c)
      }
    }
    return this
  }

  protected postfixes: string[] = []

  /**
   * @example
   *   `Text`.badge(3) -> 'Text (3)' // §r
   *   `Text`.badge(0) -> 'Text'
   */
  size(n: number | undefined, text = this.colors.text, num = this.colors.num) {
    if (!n) return this
    this.postfixes.push(` ${text}(${num}${n}${text})`)
    return this
  }

  /**
   * @example
   *   `Text`.badge(3) -> 'Text §4(§c3§4)' // §r
   *   `Text`.badge(0) -> 'Text'
   */
  badge(n: number | undefined) {
    return this.size(n, '§4', '§c')
  }

  // Name is not toString to avoid unexpected behavior related to js builtin toString
  to(language: Language): string {
    const preprocessed = extractedTranslatedMessages[language]?.[this.id]
    if (preprocessed) {
      return this.interpolatePreprocessed(language, preprocessed, this.args, this.colors, this.postfixes)
    }
    // Fallback to raw template joined with \x00 (should not happen)
    return this.interpolateRaw(language, this.template.join('\x00'), this.args, this.colors, this.postfixes)
  }

  protected interpolatePreprocessed(
    language: Language,
    data: Preprocessed,
    args: readonly unknown[],
    colors: Text.Colors,
    postfixes: string[] = [],
  ): string {
    let result = ''
    for (const [i, v] of data.s.entries()) {
      result += colors.text + v
      if (i < data.i.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result += textUnitColorize(args[data.i[i]!], colors, language)
      }
    }
    for (const postfix of postfixes) {
      result += postfix
    }
    return result
  }

  protected interpolateRaw(
    language: Language,
    template: string,
    args: readonly unknown[],
    colors: Text.Colors,
    postfixes: string[] = [],
  ): string {
    if (typeof language !== 'string')
      throw new TypeError(`Message.string must be called with language, got ${typeof language}`)

    let result = ''
    let lastIndex = 0
    const regex = /\{(\d+)(?:_\w+)?\}/g
    let match

    while ((match = regex.exec(template)) !== null) {
      const index = parseInt(match[1] ?? '0', 10)
      result += colors.text + template.slice(lastIndex, match.index)
      result += textUnitColorize(args[index], colors, language)
      lastIndex = match.index + match[0].length
    }
    result += colors.text + template.slice(lastIndex)

    for (const postfix of postfixes) {
      result += postfix
    }

    return result
  }

  protected toJSON() {
    return this.to(defaultLang)
  }
}

declare global {
  interface String {
    to(): string
  }
}

String.prototype.to = function () {
  return this as string
}

export class NoI18nMessage extends Message {
  to(): string {
    return this.interpolateRaw(defaultLang, this.template.join('\x00'), this.args, this.colors, this.postfixes)
  }
}

export class SharedI18nMessage extends Message {
  toRawText(): RawText {
    const token = extractedSharedMessagesIds[this.id]
    if (!token) {
      console.warn(`RawText token missing for '${this.id}'. Run i18n extraction.`)
      return { rawtext: [{ text: '§cTRANSLATION BROKEN, REPORT' }] }
    }

    if (!this.args.length) return { rawtext: [{ translate: token }] }

    return { rawtext: [{ translate: token, with: { rawtext: this.argsToRawText() } }] }
  }

  protected argsToRawText(): RawText[] {
    const order = this.getPlaceholderOrder()
    return order.map(index => this.argToRawtext(this.args[index]))
  }

  private getPlaceholderOrder(): number[] {
    const order: number[] = []
    const regex = /\{(\d+)(?:_\w+)?\}/g
    let match
    while (typeof (match = regex.exec(this.id)) === 'string') {
      order.push(parseInt(match[1], 10))
    }
    return order
  }

  private argToRawtext(arg: unknown): RawText {
    if (arg === undefined || arg === null || arg === '') {
      return { rawtext: [{ text: '' }] }
    }
    if (arg instanceof SharedI18nMessage) {
      return arg.toRawText()
    }
    if (isRawText(arg)) {
      return arg
    }
    return { rawtext: [{ text: textUnitColorize(arg, this.colors, false) }] }
  }

  to(language: Language) {
    const preprocessed = extractedTranslatedMessages[language]?.[this.id]
    if (preprocessed) {
      return this.interpolatePreprocessed(
        language,
        preprocessed,
        this.args.map(e => (isRawText(e) ? rawTextToString(e, language) : e)),
        this.colors,
        this.postfixes,
      )
    }
    return this.interpolateRaw(
      language,
      this.template.join('\x00'),
      this.args.map(e => (isRawText(e) ? rawTextToString(e, language) : e)),
      this.colors,
      this.postfixes,
    )
  }
}

function isRawText(arg: unknown): arg is RawText {
  return typeof arg === 'object' && arg !== null && 'rawtext' in arg
}

export class SharedI18nMessageJoin extends SharedI18nMessage {
  toRawText(): RawText {
    const rawtext: RawMessage[] = []
    const args = this.argsToRawText()
    for (const [i, text] of this.template.entries()) {
      rawtext.push({ text })
      if (args[i]) rawtext.push(args[i])
    }
    return { rawtext }
  }
}

export class SharedNoI18nMessage extends SharedI18nMessage {
  toRawText(): RawText {
    return { rawtext: [{ text: this.to(defaultLang) }] }
  }

  protected argsToRawText() {
    return []
  }
}

export class ServerSideI18nMessage extends Message {
  constructor(
    colors: Text.Colors,
    protected readonly generate: (language: Language) => string,
  ) {
    super([], [], colors)
  }

  to(language: Language): string {
    return this.generate(language)
  }
}

export class PluralMessage extends Message {
  constructor(
    colors: Text.Colors,
    template: TemplateStringsArray,
    protected n: number,
  ) {
    super(template, [], colors)
  }

  to(l: Language): string {
    const n = this.n
    const plurals = extractedTranslatedPlurals[l]?.[this.id]
    if (plurals) {
      const rule = intlPlural(l, n)
      const form = plurals[rule]
      if (form) {
        return this.interpolatePreprocessed(l, form, [n], this.colors, this.postfixes)
      }
    }
    // Fallback: raw template with regex
    return this.interpolateRaw(l, this.template.join('\x00'), [n], this.colors, this.postfixes)
  }
}
