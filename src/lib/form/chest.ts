import { BlockPermutation, Player } from '@minecraft/server'

// @ts-expect-error TS(2792) FIXME: Cannot find module '@minecraft/server-ui'. Did you... Remove this comment to see the full error message
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { typeIdToReadable } from 'lib/GameUtils'
import { util } from 'lib/util'
import { typeIdToDataId, typeIdToID } from '../../chestui/typeIds'
import { BUTTON, showForm } from './utils'

const NUMBER_OF_1_16_100_ITEMS = 0

/** @satisfies {Record<string, [string, number]>} */
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
}

/**
 * @typedef {{
 *   text: string
 *   icon: string | undefined | number
 *   callback?: (p: Player) => void
 * }} ChestButton
 */

/**
 * @typedef {object} ChestButtonOptions
 * @property {number} slot The slot to display the item in.
 * @property {string} icon The type id or the path to the texture of the item or block.
 * @property {string} [nameTag] The name of the item to display.
 * @property {string} [description] The description that will be word-wrapped and passed to lore. Overrides lore value.
 * @property {string[]} [lore] The item's lore to display.
 * @property {number} [amount] The stack size for the item.
 * @property {boolean} [enchanted] If the item is enchanted or not.
 * @property {ChestButton['callback']} [callback]
 */

export class ChestForm {
  /**
   * @param {Pick<BlockPermutation, 'getAllStates' | 'type'>} permutation
   * @returns {Omit<ChestButtonOptions, 'slot'>}
   */
  static permutationToButton(permutation) {
    const states = permutation.getAllStates()
    return {
      nameTag: typeIdToReadable(permutation.type.id),
      icon: permutation.type.id,
      lore: [...(Object.keys(states).length ? util.inspect(states).split('\n') : [])],
    }
  }

  /**
   * @private
   * @type {string}
   */
  titleText

  /**
   * @private
   * @type {ChestButton[]}
   */
  buttons = []

  /** @param {keyof typeof SIZES} sizeType */
  constructor(sizeType = 'small') {
    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const [sizeName, size] = SIZES[sizeType]

    this.titleText = sizeName

    // @ts-expect-error TS(2322) FIXME: Type 'string' is not assignable to type 'never'.
    for (let i = 0; i < size; i++) this.buttons.push({ text: '', icon: undefined })
  }

  /** @param {string} text */
  title(text) {
    this.titleText += text
    return this
  }

  /**
   * Adds a button to this chest ui with an icon from a resource pack.
   *
   * @param {ChestButtonOptions} o
   */
  button({ slot, icon, nameTag = '', lore = [], description, amount = 1, enchanted = false, callback }) {
    const id = icon.includes(':') ? icon : 'minecraft:' + icon
    const ID = typeIdToID.get(id) ?? typeIdToDataId.get(id)
    if (typeof ID === 'undefined' && icon.includes('minecraft:')) icon = BUTTON['?']
    if (description) lore = util.wrapLore(description)

    /** @type {ChestButton} */
    const slotData = {
      text: `stack#${Math.min(Math.max(amount, 1) || 1, 99)
        .toString()
        // @ts-expect-error TS(7006) FIXME: Parameter 'e' implicitly has an 'any' type.
        .padStart(2, '0')}§r${nameTag}§r${lore.map(e => '\n§r' + e).join('')}`,

      icon: typeof ID === 'number' ? (ID + (ID < 256 ? 0 : NUMBER_OF_1_16_100_ITEMS)) * 65536 : icon,

      callback: callback ?? (p => this.show(p)),
    }

    if (enchanted && typeof slotData.icon === 'number') {
      slotData.icon += 32768
    }

    // @ts-expect-error TS(2322) FIXME: Type '{ text: string; icon; callback; }'... Remove this comment to see the full error message
    this.buttons[slot] = slotData
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
  pattern(from, pattern, key) {
    for (let y = 0; y < pattern.length; y++) {
      const row = pattern[y]
      for (let x = 0; x < row.length; x++) {
        const slot = key[row[x]]
        if (!slot) continue

        this.button({
          ...slot,
          slot: from[1] + x + (from[0] + y) * 9,
        })
      }
    }
    return this
  }

  /** @param {Player} player */
  show(player) {
    const form = new ActionFormData().title(this.titleText)
    for (const button of this.buttons) {
      // @ts-expect-error TS(2339) FIXME: Property 'text' does not exist on type 'never'.
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

        // @ts-expect-error TS(2339) FIXME: Property 'callback' does not exist on type 'never'... Remove this comment to see the full error message
        const callback = this.buttons[response.selection].callback
        if (!callback) this.show(player)
        else util.catch(() => callback(player))
      })
      .catch(util.error)
  }
}
