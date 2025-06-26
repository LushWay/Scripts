import { RawText } from '@minecraft/server'
import { defaultLang, Language } from 'lib/assets/lang'
import { extractedSharedMessagesIds, extractedTranslatedMessages } from 'lib/assets/lang-messages'
import { Text, textUnitColorize } from './text'

export type RawTextArg = number | object | boolean | string | RawText | SharedI18nMessage | undefined | null

export class Message {
  static translate(lang: Language, msg: Text) {
    return typeof msg === 'string' ? msg : msg.toString(lang)
  }

  static concatTemplateStringsArray(
    language: Language,
    template: readonly string[],
    args: readonly unknown[],
    colors: Text.Colors,
    postfixes: string[] = [],
  ) {
    if (typeof language !== 'string')
      throw new TypeError(`Message.string ${template.join('$')} must be called with language`)

    if (template.length === 1 && template[0] && args.length === 0 && postfixes.length === 0 && colors.text === '§7')
      return template[0] // Return as is, without any colors if string has no args nor postfixes

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

  color(c: Text.Colors | Pick<Text.Static<never, never>, 'currentColors'>) {
    this.colors = 'currentColors' in c ? c.currentColors : c
    for (const arg of this.args) if (arg instanceof Message) arg.color(c)
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
    return Message.concatTemplateStringsArray(language, this.template, this.args, this.colors, this.postfixes)
  }

  protected stringify(language: Language, template = this.template) {
    if (typeof language !== 'string') throw new TypeError(`Message.toString ${this.id} must be called with language`)

    if (
      template.length === 1 &&
      template[0] &&
      this.args.length === 0 &&
      this.postfixes.length === 0 &&
      this.colors.text === '§7'
    )
      return template[0] // Return as is, without any colors if string has no args nor postfixes

    let v = ''
    for (const [i, t] of [...template, ...this.postfixes].entries()) {
      v += this.colors.text + t
      if (i in this.args) v += textUnitColorize(this.args[i], this.colors, language)
    }
    return v
  }

  protected toJSON() {
    return this.toString(defaultLang)
  }
}

export class I18nMessage extends Message {
  toString(language: Language): string {
    const translated = extractedTranslatedMessages[language]?.[this.id]
    return Message.concatTemplateStringsArray(
      language,
      translated ? (Array.isArray(translated) ? translated : [translated]) : this.template,
      this.args,
      this.colors,
      this.postfixes,
    )
  }
}

export class SharedI18nMessage extends I18nMessage {
  toRawText(): RawText {
    const token = extractedSharedMessagesIds[this.id]
    if (!token)
      throw new Error(`RawText is not supported for '${this.id.replaceAll('\\x00', '%s').replaceAll('\n', '\\n')}'`)

    return { rawtext: [{ translate: token, with: { rawtext: [...this.argumentsToRawText()] } }] }
  }

  protected *argumentsToRawText() {
    const args = this.args as RawTextArg[]
    for (const [i, arg] of args.entries()) {
      if (arg === '' || arg === undefined || arg === null) continue
      if (this.isRawText(arg)) {
        yield { text: this.colors.unit }
        if (Array.isArray(arg.rawtext)) yield* arg.rawtext
        else yield arg
      } else if (arg instanceof SharedI18nMessage) yield arg.toRawText()
      else yield { text: textUnitColorize(arg, this.colors, false) }

      if (args[i + 1]) yield { text: this.colors.text }
    }
  }

  protected isRawText(arg: unknown): arg is RawText {
    return typeof arg === 'object' && arg !== null && 'rawtext' in arg
  }
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
}
