import { RawMessage, RawText } from '@minecraft/server'
import { defaultLang, Language } from 'lib/assets/lang'
import { Text, textUnitColorize } from './text'
import { extractedSharedMessagesIds, extractedTranslatedMessages } from 'lib/assets/lang-messages'
type I18nMessages = Record<string, Record<string, string | readonly string[]>>

const extractedMessageIdsToLangTokes: Record<string, string> = extractedSharedMessagesIds

const extractedCompiledMessages: I18nMessages = extractedTranslatedMessages

export type RawTextArg = string | RawText | Message | undefined | null

export class Message {
  static translate(lang: Language, msg: Text) {
    return typeof msg === 'string' ? msg : msg.toString(lang)
  }

  static string(
    language: Language,
    template: readonly string[],
    args: readonly unknown[],
    colors: Text.Colors,
    postfixes: string[] = [],
  ) {
    if (template.length === 1 && template[0] && args.length === 0 && postfixes.length === 0 && colors.text === '§7')
      return template[0] // Return as is, without any colors if string has no args

    let v = ''
    for (const [i, t] of [...template, ...postfixes].entries()) {
      v += colors.text + t
      if (i in args) v += textUnitColorize(args[i], colors, language)
    }
    return v
  }

  readonly id: string

  constructor(
    protected readonly template: readonly string[],
    protected readonly args: readonly unknown[],
    protected colors: Text.Colors,
  ) {
    this.id = template.join('\x00')
  }

  color(c: Text.Colors | Pick<Text.Static<unknown>, 'currentColors'>) {
    // if (this.postfixes.length) {
    //   console.warn(`Color modificator for message ${this.id} will not be applied for postfixes ${this.postfixes}`)
    // }

    this.colors = 'currentColors' in c ? c.currentColors : c
    for (const arg of this.args) {
      if (arg instanceof Message) arg.color(c)
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
  toString(language: Language) {
    if (typeof language !== 'string') throw new TypeError(`Message.toString ${this.id} must be called with language`)
    return Message.string(language, this.template, this.args, this.colors, this.postfixes)
  }

  toRawText(): RawText {
    const template = this.template.slice()
    const rawtext: RawMessage[] = template[0] ? [{ text: this.colors.text }] : []

    for (const [i, t] of template.entries()) {
      const arg = this.args[i]
      if (t) rawtext.push({ text: t }) // Do not add empty texts

      rawtext.push(...this.argToRawText(arg, template[i + 1]))
    }

    return { rawtext }
  }

  protected isRawText(arg: unknown): arg is RawText {
    return typeof arg === 'object' && arg !== null && 'rawtext' in arg
  }

  protected *argToRawText(arg: unknown, nextText = ''): Generator<RawMessage> {
    if (arg === '' || arg === undefined || arg === null) return

    if (arg instanceof Message) yield arg.toRawText()
    else if (this.isRawText(arg)) {
      yield { text: this.colors.unit }

      if (Array.isArray(arg.rawtext)) yield* arg.rawtext
      else yield arg

      //
    } else yield { text: textUnitColorize(arg, this.colors, false) }

    if (nextText) yield { text: this.colors.text }
  }

  protected toJSON() {
    return this.toString(defaultLang)
  }
}

export class I18nMessage extends Message {
  toString(language: Language): string {
    const translated = extractedCompiledMessages[language]?.[this.id]
    return Message.string(
      language,
      translated ? (Array.isArray(translated) ? translated : [translated]) : this.template,
      this.args,
      this.colors,
      this.postfixes,
    )
  }

  toRawText(): RawText {
    const token = extractedMessageIdsToLangTokes[this.id]
    if (!token) throw new Error(`RawText is not supported for ${this.id}`)

    return { rawtext: [{ translate: token, with: this.argsToRawText() }] }
  }

  protected argsToRawText(): RawMessage['with'] {
    if (!this.args.length) return

    const rawtext: RawText[] = []
    for (const arg of this.args) rawtext.push(...this.argToRawText(arg))
    return { rawtext }
  }
}

export class SharedI18nMessage extends I18nMessage {
  shared = true
}

export class ServerSideI18nMessage extends I18nMessage {
  constructor(
    colors: Text.Colors,
    protected readonly generate: (language: Language) => string,
  ) {
    super([], [], colors)
  }

  toString(language: Language): string {
    return this.generate(language)
  }

  toRawText(): RawText {
    throw new TypeError('ServerSideI18nMessage does not support toRawText!')
  }
}
