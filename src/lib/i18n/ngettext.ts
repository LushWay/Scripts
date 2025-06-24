import { Language } from 'lib/assets/lang'
import { intlPlural } from './intl'

export type Plurals = [one: string, two: string, five: string]

/**
 * Gets plural form based on provided number
 *
 * @param n - Number
 * @param forms - Plurals forms in format `1 секунда 2 секунды 5 секунд`
 * @returns Plural form. Currently only Russian supported
 */
export function ngettext(n: number, [one, few, many]: Plurals): string {
  if (!Number.isInteger(n)) return many
  return intlPlural(Language.ru_RU, n, {
    one,
    few,
    many,
  })
}
