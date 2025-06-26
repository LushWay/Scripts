import { extractedTranslatedPlurals } from 'lib/assets/lang-messages'
import { intlPlural } from 'lib/i18n/intl'
import { i18n } from 'lib/i18n/text'
import { ServerSideI18nMessage } from './message'

export function i18nPlural(template: TemplateStringsArray, n: number): ServerSideI18nMessage {
  const id = ServerSideI18nMessage.templateToId(template)
  return new ServerSideI18nMessage(i18n.currentColors, l => {
    const translated = extractedTranslatedPlurals[l]?.[id]?.[intlPlural(l, n)] ?? template
    return ServerSideI18nMessage.concatTemplateStringsArray(l, translated, [n], i18n.currentColors, [])
  })
}

const a = i18nPlural`There is ${1} unread messageв`

const b = i18nPlural`${3} unread messageв`
