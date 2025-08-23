import { Enchantment, RawMessage, RawText } from '@minecraft/server'
import { MinecraftEnchantmentTypes } from '@minecraft/vanilla-data'
import { blockItemsLangJson, langs } from 'lib/assets/lang-big'
import { addNamespace, inspect } from 'lib/util'
import { Language } from '../assets/lang'
import { sprintf } from './sprintf'

/**
 * Gets lang token of type id and translates it server side based on providen language
 *
 * @example
 *   translateTypeId('minecraft:chorus_fruit', Language.en_US) // Chorus fruit
 *
 * @example
 *   translateTypeId('minecraft:cobblestone', Language.en_US) // Cobblestone
 *
 * @param typeId - Type id of block or item
 */

export function translateTypeId(typeId: string, lang: Language) {
  return translateToken(langToken(typeId), lang)
}
/**
 * Gets localization name of the ItemStack or Block
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
export function translateEnchantment(e: MinecraftEnchantmentTypes | Enchantment, language: Language): string {
  let result = translateTypeId(addNamespace(typeof e === 'string' ? e : e.type.id), language)

  if (typeof e === 'object' && e.level > 0) {
    const level =
      e.level < 10 ? translateTypeId(`enchantment.level.${e.level.toString()}`, language) : e.level.toString()
    result += ' ' + level
  }

  return result
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
export function translateToken(token: string | undefined, lang: Language): string {
  if (!token) return ''

  const langMap = langs[lang]

  if (!(lang in langs) || !langMap[token]) {
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
