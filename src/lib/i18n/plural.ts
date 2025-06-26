import { SharedI18nMessage } from './message'

export function i18nPlural(template: TemplateStringsArray, n: number): SharedI18nMessage {
  throw new Error('not implemented')
}

const a = i18nPlural`There is ${1} unread messageв`

const b = i18nPlural`${3} unread messageв`
