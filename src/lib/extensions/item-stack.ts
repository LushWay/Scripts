import {
  ItemCooldownComponent,
  ItemDurabilityComponent,
  ItemEnchantableComponent,
  ItemFoodComponent,
  ItemStack,
} from '@minecraft/server'
import { util } from 'lib/util'
import { expand } from './extend'

declare module '@minecraft/server' {
  interface ItemStack {
    /** Alias to {@link ItemStack.getComponent}('cooldown') */
    cooldown: ItemCooldownComponent

    /** Alias to {@link ItemStack.getComponent}('enchantable') */
    enchantable: ItemEnchantableComponent

    /** Alias to {@link ItemStack.getComponent}('durability') */
    durability: ItemDurabilityComponent

    /** Alias to {@link ItemStack.getComponent}('food') */
    food: ItemFoodComponent

    /** Checks if one item stack properties are fully equal to another (nameTag and lore) */
    is(another: ItemStack): boolean

    /** Sets nameTag and lore */
    setInfo(nameTag: string, description: string): ItemStack
  }
}

Object.defineProperties(ItemStack.prototype, {
  enchantable: {
    get() {
      return this.getComponent(ItemEnchantableComponent.componentId)
    },
    configurable: false,
    enumerable: true,
  },
  food: {
    get() {
      return this.getComponent(ItemFoodComponent.componentId)
    },
    configurable: false,
    enumerable: true,
  },
  durability: {
    get() {
      return this.getComponent(ItemDurabilityComponent.componentId)
    },
    configurable: false,
    enumerable: true,
  },
  cooldown: {
    get() {
      return this.getComponent(ItemCooldownComponent.componentId)
    },
    configurable: false,
    enumerable: true,
  },
})

expand(ItemStack.prototype, {
  setInfo(nameTag, description) {
    this.nameTag = '§r' + nameTag
    this.setLore(util.wrapLore(description))

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
