import { ItemStack } from '@minecraft/server'
import { util } from 'lib/util.js'
import { OverTakes } from './OverTakes.js'

Object.defineProperties(ItemStack.prototype, {
  enchantments: {
    get() {
      return this.getComponent('enchantments')
    },
    configurable: false,
    enumerable: true,
  },
  food: {
    get() {
      return this.getComponent('food')
    },
    configurable: false,
    enumerable: true,
  },
  durability: {
    get() {
      return this.getComponent('durability')
    },
    configurable: false,
    enumerable: true,
  },
  cooldown: {
    get() {
      return this.getComponent('cooldown')
    },
    configurable: false,
    enumerable: true,
  },
})

OverTakes(ItemStack.prototype, {
  setInfo(nameTag, description) {
    this.nameTag = '§r' + nameTag
    this.setLore(loreWordWrap(description))

    return this.clone()
  },
  is(item) {
    try {
      if (!item || !(item instanceof ItemStack)) return false
      if (this.isStackable && this.isStackableWith(item)) return true

      const anotherLore = item.getLore()
      return (
        this.typeId === item.typeId &&
        this.nameTag === item.nameTag &&
        this.getLore().every((a, i) => a === anotherLore[i])
      )
    } catch (error) {
      if (error instanceof ReferenceError && error.message.includes('Native object')) {
        return false
      } else throw error
    }
  },
})

const loreLimit = 30

/**
 * @param {string} description
 */
export function loreWordWrap(description) {
  let color = '§7'
  return util
    .wrap(description, { width: loreLimit })
    .split('\n')
    .map(e => {
      const match = e.match(/^§./)
      if (match) color = match[0]
      return '§r' + color + e
    })
}
