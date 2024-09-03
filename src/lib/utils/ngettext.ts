export type Plurals = [one: string, two: string, five: string]
/**
 * Gets plural form based on provided number
 *
 * @param n - Number
 * @param forms - Plurals forms in format `1 секунда 2 секунды 5 секунд`
 * @returns Plural form. Currently only Russian supported
 */

export function ngettext(n: number, [one, few, more]: Plurals) {
  if (!Number.isInteger(n)) return more
  return [one, few, more][
    n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
  ]
}
