import { RawMessage, RawText } from '@minecraft/server'
import { Language } from 'lib/assets/lang'
import { Text, textUnitColorize } from './text'
type I18nMessages = Record<string, Record<string, readonly string[]>>

const extractedMessageIdsToLangTokes: Record<string, string> = {}
const extractedCompiledMessages: I18nMessages = {}

export type RawTextArg = string | RawText | Message | undefined | null

export class Message {
  readonly id: string

  constructor(
    protected readonly template: readonly string[],
    protected readonly args: readonly unknown[],
    readonly colors: Text.Colors,
  ) {
    this.id = template.join('\x00')
  }

  protected postfixes: string[] = []

  size(n: number | undefined, text = this.colors.text, num = this.colors.num) {
    if (!n) return this
    this.postfixes.push(` ${text}(${num}${n}${text})`)
    return this
  }

  badge(n: number | undefined) {
    return this.size(n, '§c', '§4')
  }

  // Name is not toString to avoid unexpected behavior related to js builtin toString
  string(language: Language, template = this.template) {
    if (template.length === 1 && template[0] && this.args.length === 0) return template[0] // Return as is, without any colors if string has no args

    let v = ''
    for (const [i, t] of template.concat(this.postfixes).entries()) {
      v += this.colors.text + t
      if (i in this.args) v += textUnitColorize(this.args[i], this.colors, language)
    }
    return v
  }

  rawText(templateRaw = this.template): RawText {
    const template = templateRaw.slice()
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

    if (arg instanceof Message) yield arg.rawText()
    else if (this.isRawText(arg)) {
      yield { text: this.colors.unit }

      if (Array.isArray(arg.rawtext)) yield* arg.rawtext
      else yield arg

      //
    } else yield { text: textUnitColorize(arg, this.colors, false) }

    if (nextText) yield { text: this.colors.text }
  }
}

export class I18nMessage extends Message {
  string(language: Language): string {
    return super.string(language, extractedCompiledMessages[language]?.[this.id] ?? this.template)
  }

  rawText(): RawText {
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

export class ServerSideI18nMessage extends I18nMessage {
  constructor(
    colors: Text.Colors,
    protected readonly generate: (language: Language) => string,
  ) {
    super([], [], colors)
  }

  string(language: Language): string {
    return this.generate(language)
  }

  rawText(): RawText {
    throw new TypeError('ServerSideI18nMessage does not support toRawText!')
  }
}
