import { RawMessage, RawText } from '@minecraft/server'
import { defaultLang, Language } from 'lib/assets/lang'
import { extractedSharedMessagesIds, extractedTranslatedMessages } from 'lib/assets/lang-messages'
import { textUnitColorize } from './text'

export type RawTextArg = number | boolean | string | RawText | SharedI18nMessage | undefined | null

export class Message {
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

  static templateToId(template: readonly string[]) {
    return template.join('\x00')
  }

  readonly id: string

  constructor(
    protected readonly template: readonly string[],
    protected readonly args: readonly unknown[],
    protected colors: Text.Colors,
  ) {
    this.id = Message.templateToId(template)
  }

  color(c: Text.Colors | Pick<Text.Static<never>, 'style'>) {
    this.colors = 'style' in c ? c.style : c
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
  to(language: Language) {
    return Message.concatTemplateStringsArray(language, this.template, this.args, this.colors, this.postfixes)
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

export class I18nMessage extends Message {
  to(language: Language): string {
    const translated = extractedTranslatedMessages[language]?.[this.id] ?? this.template
    return Message.concatTemplateStringsArray(language, translated, this.args, this.colors, this.postfixes)
  }
}

export class SharedI18nMessage extends I18nMessage {
  toRawText(): RawText {
    const token = extractedSharedMessagesIds[this.id]
    if (!token) {
      console.warn(
        `RawText is not supported for '${this.id.replaceAll('\x00', '\\u0000').replaceAll('\n', '\\n')}'. Please run i18n:extract`,
      )

      return { rawtext: [{ text: '§cTRANSLATION BROKEN, REPORT' }] }
    }

    if (!this.args.length) return { rawtext: [{ translate: token }] }

    return { rawtext: [{ translate: token, with: { rawtext: this.argsToRawText() } }] }
  }

  protected argsToRawText() {
    const argsRawtext: RawText[] = []
    const args = this.args as RawTextArg[]
    for (const [i, arg] of args.entries()) {
      if (arg === '' || arg === undefined || arg === null) {
        argsRawtext.push({ rawtext: [{ text: '' }] })
        continue
      }

      let messages: RawMessage[] = []
      if (arg instanceof SharedI18nMessage) {
        messages = arg.toRawText().rawtext ?? []
      } else if (isRawText(arg)) {
        messages.push({ text: this.colors.unit }, arg)
      } else messages.push({ text: textUnitColorize(arg, this.colors, false) })

      const textNext = this.template[i + 1]
      if (textNext) messages.push({ text: this.colors.text })

      argsRawtext.push({ rawtext: messages })
    }
    return argsRawtext
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

export class ServerSideI18nMessage extends I18nMessage {
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
