/* i18n-ignore */
import 'lib/assets/intl'

import { defaultLang, IntlLanguage, Language, supportedLanguages } from 'lib/assets/lang'
import { ms } from 'lib/utils/ms'
import { textUnitColorize } from './text'

function intlCreate<T>(creator: (intlLocale: string) => T) {
  const locales = Object.fromEntries(supportedLanguages.map(e => [e, creator(IntlLanguage[e])]))
  return (locale: Language) => (locales[locale] as T | undefined) ?? locales[defaultLang]
}

const conjunction = intlCreate(e => new Intl.ListFormat(e, { type: 'conjunction', localeMatcher: 'lookup' }))
const disjunction = intlCreate(e => new Intl.ListFormat(e, { type: 'disjunction', localeMatcher: 'lookup' }))

export function intlListFormat(colors: Text.Colors, language: Language, type: 'or' | 'and', list: Text[]) {
  const getFormatterFor = type === 'or' ? disjunction : conjunction
  const parts = getFormatterFor(language).formatToParts(list.map(e => textUnitColorize(e, colors, language)))
  const { text } = colors
  return parts.map(e => (e.type === 'element' ? e.value : text + e.value)).join('') + text
}

const plural = intlCreate(e => new Intl.PluralRules(e, { type: 'cardinal', localeMatcher: 'lookup' }))

export function intlPlural(language: Language, n: number) {
  return plural(language).select(n)
}

declare global {
  namespace Intl {
    interface Duration {
      years?: number
      months?: number
      weeks?: number
      days?: number
      hours?: number
      minutes?: number
      seconds?: number
      milliseconds?: number
    }

    class DurationFormat {
      constructor(
        lang: string,
        options: { style: 'long' | 'short' | 'narrow'; localeMatcher: Intl.ListFormatLocaleMatcher },
      )

      format(time: Duration): string
    }
  }
}

const durations = intlCreate(e => new Intl.DurationFormat(e, { style: 'long', localeMatcher: 'lookup' }))

/**
 * Parses the remaining time in milliseconds into a more human-readable format
 *
 * @example
 *   intlRemaining(1000)  // 1 секунда
 *   intlRemaining(1000 * 60 * 2) // 2 минуты
 *   intlRemaining(1000 * 60 * 2, [ms.converters.sec]) // 120 секунд
 *
 * @param ms - Milliseconds to parse from
 * @param converters - List of types to convert to. If some time was not specified, e.g. ms, the most closest type will
 *   be used
 */
export function intlRemaining(
  locale: Language,
  n: number,
  converters = [ms.converters.day, ms.converters.hour, ms.converters.min, ms.converters.sec],
): string {
  const duration: Intl.Duration = {}
  for (const converter of converters) {
    const amount = ~~(n / converter.time)
    duration[converter.name] = amount
    n = n - amount * converter.time
  }
  return durations(locale).format(duration).replaceAll('\u00a0', '.')
}
