import { ItemLockMode, ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { MinecraftEnchantmentTypes } from 'lib/List/enchantments'

declare module '@minecraft/server' {
  interface PlayerDatabase {
    server?: {
      invs: Record<string, string>
    }
    roleSetter?: 1
  }
}

export namespace LootItem {
  interface Common {
    /**
     * - Amount of the item
     * @default 1
     */
    amount?: RandomCostMapType | number
    /**
     * - Cost of the item. Items with higher cost will be generated more often
     */
    chance: Percent

    /**
     * - Map in format { enchant: { level: percent } }
     */
    enchantments?: Partial<
      Record<keyof typeof MinecraftEnchantmentTypes, RandomCostMapType>
    >
    /**
     * - Damage of the item
     */
    damage?: RandomCostMapType

    /**
     * - Additional options for the item like canPlaceOn, canDestroy, nameTag etc
     */
    options?: Options
  }

  interface Options {
    lore?: string[]
    nameTag?: string
    keepOnDeath?: boolean
    canPlaceOn?: string[]
    canDestroy?: string[]
    lockMode?: ItemLockMode
  }

  interface TypeIdInput {
    /**
     * - Stringified id of the item. May include namespace (e.g. "minecraft:").
     */
    typeId: string
  }

  interface TypeInput {
    /**
     * - Item type name. Its key of MinecraftItemTypes.
     */
    type: Exclude<keyof typeof MinecraftItemTypes, 'prototype' | 'string'>
  }

  interface ItemStackInput {
    /**
     * - Item stack. Will be cloned.
     */
    itemStack: ItemStack
  }

  type Input = (TypeIdInput | TypeInput | ItemStackInput) & Common

  type Stored = {
    itemStack: ItemStack
    enchantments: Record<string, number[]>
    chance: number
    amount: number[]
    damage: number[]
  }
}
