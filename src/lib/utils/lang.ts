import { Enchantment, RawMessage, RawText } from '@minecraft/server'
import { MinecraftEnchantmentTypes } from '@minecraft/vanilla-data'
import { addNamespace, inspect } from 'lib/util'
import { blockItemsLangJson, langs, Language } from '../assets/lang'
import { sprintf } from './sprintf'

/**
 * Converts any minecraft type id to human readable format, e.g. removes minecraft: prefix, replaces _ with spaces and
 * capitalizes first letter
 *
 * @deprecated Consider using {@link langToken}
 * @example
 *   typeIdToReadable('minecraft:chorus_fruit') // Chorus fruit
 *
 * @example
 *   typeIdToReadable('minecraft:cobblestone') // Cobblestone
 *
 * @param {string} typeId
 */

export function typeIdToReadable(typeId: string) {
  // Format
  typeId = typeId.replace(/^minecraft:/, '').replace(/_(.)/g, ' $1')

  // Capitalize first letter
  typeId = typeId[0].toUpperCase() + typeId.slice(1)

  return typeId
}
/**
 * Gets localization name of the ItemStack
 *
 * @example
 *   const apple = new ItemStack(MinecraftItemTypes.Apple)
 *   langToken(apple) // %item.apple.name
 *
 * @example
 *   langToken(MinecraftEnchantmentTypes.Sharpness) // %enchantment.sharnpess.name
 */

export function langToken(item: { typeId: string } | string) {
  const typeId = typeof item === 'object' ? item.typeId : item
  return typeId in blockItemsLangJson ? blockItemsLangJson[typeId] : typeId
}

/**
 * Returns RawText representation of an Enchantment or Enchantment Type. If Enchanment is provided, also returns its as
 * another translated RawMessage
 */
export function translateEnchantment(e: MinecraftEnchantmentTypes | Enchantment): RawText {
  const rawtext: RawMessage[] = [{ translate: langToken(addNamespace(typeof e === 'string' ? e : e.type.id)) }]
  if (typeof e === 'object' && e.level > 0) {
    rawtext.push(
      { text: ' ' },
      e.level < 10 ? { translate: `enchantment.level.${e.level.toString()}` } : { text: e.level.toString() },
    )
  }
  return { rawtext }
}

/**
 * Translates a language token like `item.apple.name` to target language value like `Apple`
 *
 * If translation in target lang does not exists, it searches across all langs, and lastly it returns token as is
 *
 * @example
 *   translateToken(langToken(MinecraftItemTypes.Apple), 'en_US') // Apple
 *   translateToken(langToken(MinecraftItemTypes.Apple), 'ru_RU') // Яблоко
 *   translateToken('item.apple.name', 'ru_RU') // Яблоко
 *   translateToken('item.apple.name', player.lang) // Apple in player's lang
 *
 * @param lang
 * @param token
 * @returns
 */
export function translateToken(token: string, lang: Language): string {
  const langMap = langs[lang]

  if (typeof langMap === 'undefined' || !(token in langMap)) {
    for (const langMap of Object.values(langs)) {
      if (langMap[token]) return langMap[token]
    }

    return token
  } else return langMap[token]
}

export function rawTextToString(rawText: RawText, lang: Language) {
  return rawText.rawtext?.map(e => rawMessageToString(e, lang)).join('') ?? ''
}

export function rawMessageToString(rawMessage: RawMessage, lang: Language) {
  let result = ''
  if (rawMessage.text) return rawMessage.text
  if (rawMessage.translate) {
    const tr = translateToken(rawMessage.translate, lang)
    if (!rawMessage.with) {
      return tr
    } else {
      const args = []
      if (Array.isArray(rawMessage.with)) {
        for (const a of rawMessage.with) {
          args.push(a)
        }
      } else {
        if (!rawMessage.with.rawtext)
          throw new TypeError('RawMessage.with MUST contain .rawtext, got ' + inspect(rawMessage.with))
        for (const a of rawMessage.with.rawtext) {
          args.push(rawMessageToString(a, lang))
        }
      }
      sprintf(tr, ...args)
    }
  }

  if (rawMessage.rawtext) {
    for (const m of rawMessage.rawtext) {
      result += rawMessageToString(m, lang)
    }
  }

  return result
}
