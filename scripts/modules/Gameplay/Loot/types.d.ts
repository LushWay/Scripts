import { ItemLockMode, MinecraftItemTypes } from "@minecraft/server";
import { MinecraftEnchantmentTypes } from "lib/List/enchantments.js";

export namespace LootItem {
	interface Common {
		/**
		 * - Cost of item. Items with higher cost will be generated more often
		 * @default 1
		 */
		slots?: RandomCost | number;
		/**
		 * - Custom nameTag
		 */
		nameTag?: string;
		/**
		 * - Lore array
		 */
		lore?: string[];
		/**
		 * - Map in format enchant: { level: percent }
		 */
		enchantments?: Partial<
			Record<keyof typeof MinecraftEnchantmentTypes, RandomCost>
		>;
		/**
		 * - Item amount in format amount: percent
		 */
		amount: RandomCost | number;
		/**
		 * - Additional options for item like canPlaceOn, canDestroy, durability component etc
		 */
		options?: Options;
	}

	interface Options {
		durability?: number;
		keepOnDeath?: boolean;
		canPlaceOn?: string[];
		canDestroy?: string[];
		lockMode?: ItemLockMode;
	}

	interface ID {
		/**
		 * - Stringified id of item. May include namespace (e.g. "minecraft:")
		 */
		id: string;
	}

	interface Type {
		/**
		 * - Item type name. Its key of MinecraftItemTypes
		 */
		type: keyof typeof MinecraftItemTypes;
	}

	type Input = (ID | Type) & Common;

	type Stored = ID & {
		nameTag: string;
		lore: string[];
		slot: () => number;
		enchantments: () => Record<keyof typeof MinecraftEnchantmentTypes, number>;
		amount: () => number;
		options: Options;
	};
}
