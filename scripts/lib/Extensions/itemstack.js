import { ItemStack } from '@minecraft/server'
import { OverTakes } from 'xapi.js'

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
    this.nameTag = nameTag
    this.setLore(wordWrap(description))

    return this
  },
  is(another) {
    if (this.isStackable && this.isStackableWith(another)) return true
    const anotherLore = another.getLore()
    return (
      this.typeId === another.typeId &&
      this.nameTag === another.nameTag &&
      this.getLore().every((a, i) => a === anotherLore[i])
    )
  },
})

const loreLimit = 30

/**
 * @param {string} description
 */
export function wordWrap(description) {
  /** @type {string[]} */
  const lore = []

  for (const word of description.split(' ')) {
    if (!word) continue

    const last = lore.length - 1
    if (!lore[last]) {
      lore.push(word)
      continue
    }

    if (1 + word.length + lore[last].length > loreLimit) {
      lore.push(word)
    } else {
      lore[last] += ' ' + word
    }
  }

  return lore
}
