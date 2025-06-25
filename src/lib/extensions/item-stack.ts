import {
  ItemComponent,
  ItemCooldownComponent,
  ItemDurabilityComponent,
  ItemEnchantableComponent,
  ItemFoodComponent,
  ItemStack,
} from '@minecraft/server'
import { wrapLore } from 'lib/util'
import { expand } from './extend'

interface ItemComponentAliases {
  /** Alias to {@link ItemStack.getComponent}('cooldown') */
  cooldown?: ItemCooldownComponent

  /** Alias to {@link ItemStack.getComponent}('enchantable') */
  enchantable?: ItemEnchantableComponent

  /** Alias to {@link ItemStack.getComponent}('enchantable') */
  durability?: ItemDurabilityComponent

  /** Alias to {@link ItemStack.getComponent}('enchantable') */
  food?: ItemFoodComponent
}

declare module '@minecraft/server' {
  interface ItemStack extends ItemComponentAliases {
    /** Checks if one item stack properties are fully equal to another (nameTag and lore) */
    is(another: ItemStack): boolean

    /** Sets nameTag and lore */
    setInfo(nameTag: Text | undefined, description: Text | undefined): ItemStack
  }
}

const aliases = {
  cooldown: ItemCooldownComponent,
  enchantable: ItemEnchantableComponent,
  durability: ItemDurabilityComponent,
  food: ItemFoodComponent,
} satisfies Record<keyof ItemComponentAliases, unknown>

for (const [aliasName, { componentId }] of Object.entries(aliases)) {
  if (aliasName in ItemStack.prototype) continue
  Object.defineProperty(ItemStack.prototype, aliasName, {
    get(this: ItemStack) {
      return this.getComponent(componentId) as ItemComponent
    },
    configurable: false,
    enumerable: true,
  })
}

expand(ItemStack.prototype, {
  setInfo(nameTag, description) {
    if (typeof nameTag === 'string') this.nameTag = '§r' + nameTag
    if (typeof description === 'string') this.setLore(wrapLore(description))

    return this.clone()
  },

  is(item) {
    try {
      if (typeof item === 'undefined' || !(item instanceof ItemStack)) return false
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
