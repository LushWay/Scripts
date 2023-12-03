import { BlockPermutation, Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { loreWordWrap } from 'lib/Extensions/itemstack.js'
import { GAME_UTILS, showForm, util } from 'smapi.js'
import { typeIdToID } from '../../chestui/typeIds.js'

const NUMBER_OF_1_16_100_ITEMS = 0

/**
 * @type {Record<'small' | 'large', [string, number]>}
 */
const SIZES = {
  small: [`§c§h§e§s§t§s§m§a§l§l§r`, 27],
  large: [`§c§h§e§s§t§l§a§r§g§e§r`, 54],
}

/**
 * @typedef {{
 *  text: string;
 *  icon: string | undefined | number;
 *  callback?: (p: Player) => void;
 * }} ChestButton
 */

/**
 * @typedef {object} ChestButtonOptions
 * @prop {number} slot The slot to display the item in.
 * @prop {string} icon The type id or the path to the texture of the item or block.
 * @prop {string} [nameTag] The name of the item to display.
 * @prop {string} [description] The description that will be word-wrapped and passed to lore. Overrides lore value.
 * @prop {string[]} [lore] The item's lore to display.
 * @prop {number} [amount] The stack size for the item.
 * @prop {boolean} [enchanted] If the item is enchanted or not.
 * @prop {ChestButton["callback"]} [callback]
 */

export class ChestForm {
  /**
   * @param {BlockPermutation} permutation
   * @returns {Omit<ChestButtonOptions, 'slot'>}
   */
  static permutationToButton(permutation) {
    const states = permutation.getAllStates()
    return {
      nameTag: GAME_UTILS.toNameTag(permutation.type.id),
      icon: permutation.type.id,
      lore: [
        ...(Object.keys(states).length ? util.inspect(states).split('\n') : []),
      ],
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

  /**
   * @param {keyof typeof SIZES} sizeType
   */
  constructor(sizeType = 'small') {
    const [sizeName, size] = SIZES[sizeType]
    this.titleText = sizeName
    for (let i = 0; i < size; i++)
      this.buttons.push({ text: '', icon: undefined })
  }
  /**
   * @param {string} text
   */
  title(text) {
    this.titleText += text
    return this
  }

  /**
   * Adds a button to this chest ui with an icon from a resource pack.
   * @param {ChestButtonOptions} o
   */
  button({
    slot,
    icon,
    nameTag = '',
    lore = [],
    description,
    amount = 1,
    enchanted = false,
    callback,
  }) {
    const ID = typeIdToID.get(icon.includes(':') ? icon : 'minecraft:' + icon)

    if (description) lore = loreWordWrap(description)

    /** @type {ChestButton} */
    const slotData = {
      text: `stack#${Math.min(Math.max(amount, 1) || 1, 99)
        .toString()
        .padStart(2, '0')}§r${nameTag}§r${lore.map(e => '\n§r' + e).join('')}`,

      icon: ID
        ? (ID + (ID < 256 ? 0 : NUMBER_OF_1_16_100_ITEMS)) * 65536
        : icon,

      callback: callback ?? (p => this.show(p)),
    }

    if (enchanted && typeof slotData.icon === 'number') {
      slotData.icon += 32768
    }

    this.buttons[slot] = slotData
    return this
  }
  /**
   * @remarks Fills slots based off of strings and a key, with the first slot being the cordinate that the pattern starts at.
   * @param {[number, number]} from The starting coordinates of the pattern, in [row, column] format, starting from [0, 0] in the top left corner.
   * @param {string[]} pattern The pattern to use, with characters not defined in key being left empty.
   * @param {Record<string, Omit<ChestButtonOptions, "slot">>} key The data to display for each character in the pattern.
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
  /**
   * @param {Player} player
   */
  show(player) {
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

        const callback = this.buttons[response.selection].callback
        if (!callback) this.show(player)
        else util.catch(() => callback(player))
      })
      .catch(util.error)
  }
}
