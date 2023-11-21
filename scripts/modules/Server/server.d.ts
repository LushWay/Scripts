import { ItemLockMode } from '@minecraft/server'
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
     * - Item amount in format amount: percent
     * @default 1
     */
    amount?: RandomCostMapType | number
    /**
     * - Cost of item. Items with higher cost will be generated more often
     */
    chance: Percent
    /**
     * - Custom nameTag
     */
    nameTag?: string
    /**
     * - Lore array
     */
    lore?: string[]
    /**
     * - Map in format enchant: { level: percent }
     */
    enchantments?: Partial<
      Record<keyof typeof MinecraftEnchantmentTypes, RandomCostMapType>
    >

    /**
     * - Additional options for item like canPlaceOn, canDestroy, durability component etc
     */
    options?: Options<RandomCostMapType>
  }

  interface Options<D> {
    damage?: D
    keepOnDeath?: boolean
    canPlaceOn?: string[]
    canDestroy?: string[]
    lockMode?: ItemLockMode
  }

  interface ID {
    /**
     * - Stringified id of item. May include namespace (e.g. "minecraft:")
     */
    id: string
  }

  interface Type {
    /**
     * - Item type name. Its key of MinecraftItemTypes
     */
    type: Exclude<keyof typeof MinecraftItemTypes, 'prototype' | 'string'>
  }

  type Input = (ID | Type) & Common

  type Stored = {
    id: string
    nameTag: string
    lore: string[]
    chance: number
    enchantments: Record<string, number[]>
    amount: number[]
    options: Options<number[]>
  }
}
