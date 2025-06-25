import { BlockPermutation, ItemPotionComponent, ItemStack, Player } from '@minecraft/server'

import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { MinecraftItemTypes, MinecraftPotionLiquidTypes } from '@minecraft/vanilla-data'
import { Items, totalCustomItems } from 'lib/assets/custom-items'
import { textureData } from 'lib/assets/texture-data'
import { translateTypeId } from 'lib/i18n/lang'
import { addNamespace, inspect, isKeyof, util, wrapLore } from 'lib/util'
import { typeIdToDataId, typeIdToID } from '../assets/chest-ui-type-ids'
import { BUTTON, showForm } from './utils'

const NUMBER_OF_1_16_100_ITEMS = totalCustomItems

const customItemsReverted: Record<string, string> = Object.map(Items, (k, v) => [v, k])
export function getAuxOrTexture(textureOrTypeId: string, enchanted = false) {
  if (textureOrTypeId === MinecraftItemTypes.Potion) {
    console.warn(new Error('Potion passed to getAuxOrTexture, use getAuxTextureOrPotionAux instead'))
  }

  if (textureOrTypeId.startsWith('textures')) return textureOrTypeId
  if (isKeyof(textureOrTypeId, textureData)) return textureData[textureOrTypeId]

  if (
    customItemsReverted[textureOrTypeId] ||
    (textureOrTypeId.startsWith('lw:') && textureOrTypeId.includes('_spawn_egg'))
  )
    return `textures/items/${textureOrTypeId.replace('lw:', '').replace('_spawn_egg', '')}`

  const typeId = addNamespace(textureOrTypeId)
  const ID = typeIdToID.get(typeId) ?? typeIdToDataId.get(typeId)
  return idToAux(ID, enchanted)
}

function idToAux(ID: number | undefined, enchanted: boolean) {
  if (typeof ID === 'undefined') return BUTTON['?']

  let AUX = (ID + (ID < 256 ? 0 : NUMBER_OF_1_16_100_ITEMS)) * 65536
  if (enchanted) AUX += 32768

  return AUX.toString()
}

export function getAuxTextureOrPotionAux(itemStack: ItemStack) {
  const potion = itemStack.getComponent(ItemPotionComponent.componentId)
  if (!potion) return getAuxOrTexture(MinecraftItemTypes.Potion)

  const { potionEffectType: effect, potionLiquidType: liquid } = potion
  const type = liquid.id !== MinecraftPotionLiquidTypes.Regular ? '_' + liquid.id.toLowerCase() : ''
  const effectId =
    (effect.id[0] ?? '').toLowerCase() +
    effect.id
      .slice(1)
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
  const typeId =
    effectId === 'none' && type === ''
      ? 'minecraft:potion'
      : `minecraft:${effectId === 'none' ? '' : effectId}${type}_potion`
  const ID = typeIdToDataId.get(typeId)

  return idToAux(ID, false)
}

const SIZES = {
  '5 ': ['§c§h§e§s§t§0§5§r§f', 5],
  '9': ['§c§h§e§s§t§0§9§r§f', 9],
  '18': ['§c§h§e§s§t§1§8§r§f', 18],
  '27': ['§c§h§e§s§t§2§7§r§f', 27],
  '36': ['§c§h§e§s§t§3§6§r§f', 36],
  '45': ['§c§h§e§s§t§4§5§r§f', 45],
  '54': ['§c§h§e§s§t§5§4§r§f', 54],
  'single': ['§c§h§e§s§t§2§7§r§f', 27],
  'small': ['§c§h§e§s§t§2§7§r§f', 27],
  'double': ['§c§h§e§s§t§5§4§r§f', 54],
  'large': ['§c§h§e§s§t§5§4§r§f', 54],
} satisfies Record<string, [string, number]>

interface ChestButton {
  text: string
  icon: string | undefined
  callback?: (p: Player) => void | Promise<void>
}

export interface ChestButtonOptions {
  slot: number
  icon: string
  nameTag?: string
  description?: string
  lore?: string[]
  amount?: number
  enchanted?: boolean
  callback?: ChestButton['callback']
}

export class ChestForm {
  static permutationToButton(
    permutation: Pick<BlockPermutation, 'getAllStates' | 'type'>,
    player: Player,
  ): Omit<ChestButtonOptions, 'slot'> {
    const states = permutation.getAllStates()
    return {
      nameTag: translateTypeId(permutation.type.id, player.lang),
      icon: permutation.type.id,
      lore: [...(Object.keys(states).length ? inspect(states).split('\n') : [])],
    }
  }

  private titleText: string

  private buttons: ChestButton[] = []

  constructor(sizeType: keyof typeof SIZES = 'small') {
    const [sizeName, size] = SIZES[sizeType]

    this.titleText = sizeName + '§0'

    for (let i = 0; i < size; i++) this.buttons.push({ text: '', icon: undefined })
  }

  title(text: string) {
    this.titleText = `${this.titleText}${text}`
    return this
  }

  /** Adds a button to this chest ui with an icon from a resource pack. */
  button({
    slot,
    icon,
    nameTag = '',
    lore = [],
    description,
    amount = 1,
    enchanted = false,
    callback,
  }: ChestButtonOptions) {
    if (description) lore = wrapLore(description)

    this.buttons[slot] = {
      text: `stack#${Math.min(Math.max(amount, 1) || 1, 99)
        .toString()
        .padStart(2, '0')}§r${nameTag}§r${lore.map(e => '\n§r' + e).join('')}`,
      icon: getAuxOrTexture(icon, enchanted),
      callback: callback ?? (p => this.show(p)),
    }

    return this
  }

  /**
   * @remarks
   *   Fills slots based off of strings and a key, with the first slot being the cordinate that the pattern starts at.
   * @param {[number, number]} from The starting coordinates of the pattern, in [row, column] format, starting from [0,
   *   0] in the top left corner.
   * @param {string[]} pattern The pattern to use, with characters not defined in key being left empty.
   * @param {Record<string, Omit<ChestButtonOptions, 'slot'>>} key The data to display for each character in the
   *   pattern.
   */

  pattern(from: [number, number], pattern: string[], key: Record<string, Omit<ChestButtonOptions, 'slot'>>) {
    for (let y = 0; y < pattern.length; y++) {
      const row = pattern[y]
      if (!row) continue

      for (let x = 0; x < row.length; x++) {
        const slot = key[row[x] ?? '']
        if (!slot) continue

        this.button({ ...slot, slot: from[1] + x + (from[0] + y) * 9 })
      }
    }
    return this
  }

  show(player: Player) {
    const form = new ActionFormData().title(this.titleText)
    for (const button of this.buttons) {
      form.button(button.text, button.icon?.toString())
    }
    showForm(form, player)
      .then(response => {
        if (
          response === false ||
          !(response instanceof ActionFormResponse) ||
          typeof response.selection === 'undefined'
        )
          return

        const callback = this.buttons[response.selection]?.callback
        if (!callback) this.show(player)
        else util.catch(() => callback(player))
      })
      .catch((e: unknown) => console.error(e))
  }
}
