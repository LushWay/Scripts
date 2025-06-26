import { SharedI18nMessage } from './message'

export function i18nPlural(template: TemplateStringsArray, n: number): SharedI18nMessage {
  throw new Error('not implemented')
}

i18nPlural`There is ${1} unread message`

i18nPlural`${3} unread message`
