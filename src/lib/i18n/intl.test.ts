import { ms } from 'lib'
import { Language, supportedLanguages } from 'lib/assets/lang'
import { intlListFormat, intlRemaining } from './intl'
import { i18n } from './text'

describe('intlListFormat', () => {
  it('should translate', () => {
    expect(intlListFormat(i18n.style, Language.ru_RU, 'and', ['Abc', 'bbc', 'ddc'])).toMatchInlineSnapshot(
      `"§fAbc§7, §fbbc§7 и §fddc§7"`,
    )
    expect(intlListFormat(i18n.style, Language.ru_RU, 'or', ['Abc', 'bbc', 'ddc'])).toMatchInlineSnapshot(
      `"§fAbc§7, §fbbc§7 или §fddc§7"`,
    )
    expect(intlListFormat(i18n.style, Language.en_US, 'and', ['Abc', 'bbc', 'ddc'])).toMatchInlineSnapshot(
      `"§fAbc§7, §fbbc§7, and §fddc§7"`,
    )
    expect(intlListFormat(i18n.style, Language.en_US, 'or', ['Abc', 'bbc', 'ddc'])).toMatchInlineSnapshot(
      `"§fAbc§7, §fbbc§7, or §fddc§7"`,
    )

    const list = ['Abc', 'bbc', 'ddc']
    const nocolors = i18n.nocolor.style
    expect(intlListFormat(nocolors, Language.ru_RU, 'and', list)).toMatchInlineSnapshot(`"Abc, bbc и ddc"`)
    expect(intlListFormat(nocolors, Language.ru_RU, 'or', list)).toMatchInlineSnapshot(`"Abc, bbc или ddc"`)
    expect(intlListFormat(nocolors, Language.en_US, 'and', list)).toMatchInlineSnapshot(`"Abc, bbc, and ddc"`)
    expect(intlListFormat(nocolors, Language.en_US, 'or', list)).toMatchInlineSnapshot(`"Abc, bbc, or ddc"`)
  })

  it('should include all elements', () => {
    const values = ['ab1', 'ab2', 'ab3', 'ab4', 'ab5']
    for (const lang of supportedLanguages) {
      for (const a of ['and', 'or'] as const) {
        const formatted = intlListFormat(i18n.style, lang, a, values)
        for (const value of values) {
          expect(formatted.includes(value)).toBe(true)
        }
      }
    }
  })
})

describe('intlRemaining', () => {
  it('should get remaining time', () => {
    expect(intlRemaining(Language.ru_RU, ms.from('day', 1000))).toMatchInlineSnapshot(`"1.000 дней"`)

    expect(
      intlRemaining(Language.ru_RU, ms.from('day', 32) + ms.from('hour', 3), [ms.converters.day]),
    ).toMatchInlineSnapshot(`"32 дня"`)

    expect(
      intlRemaining(
        Language.ru_RU,
        ms.from('day', 1000) + ms.from('min', 4) + ms.from('hour', 30) + ms.from('ms', 334),
      ),
    ).toMatchInlineSnapshot(`"1.001 день 6 часов 4 минуты"`)

    expect(
      intlRemaining(
        Language.en_US,
        ms.from('day', 1000) + ms.from('min', 4) + ms.from('hour', 30) + ms.from('ms', 334),
      ),
    ).toMatchInlineSnapshot(`"1,001 days, 6 hours, 4 minutes"`)
  })
})

