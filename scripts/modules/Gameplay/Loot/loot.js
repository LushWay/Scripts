import { ItemStack, ItemTypes, MinecraftItemTypes } from "@minecraft/server";
import { RandomCost } from "../../../lib/Class/RandomCost.js";

export class LootTable {
	/**
	 * Stored items
	 * @type {Array<import("./types.js").LootItem.Stored & import("./types.js").LootItem.Stored>}
	 */
	items;

	/**
	 * Creates new LootTable with specified items
	 * @param  {...import("./types.js").LootItem.Input} items - Items to randomise
	 */
	constructor(...items) {
		this.items = items.map((item) => {
			const id =
				"type" in item ? MinecraftItemTypes[item.type] : ItemTypes.get(item.id);

			/** @type {number[]} */
			const amount =
				typeof item.amount === "number"
					? [item.amount]
					: RandomCost.toArray(item.amount);

			/** @type {Record<string, number[]>} */
			const enchantments = {};
			for (const [key, value] of Object.entries(item.enchantments)) {
				enchantments[key] = RandomCost.toArray(value);
			}

			const chance = parseInt(item.chance);
			if (isNaN(chance)) throw new TypeError("Chance must be `{number}%`");

			return {
				id: id,
				chance: chance,
				nameTag: item.nameTag ?? "",
				lore: item.lore,
				enchantments: enchantments,
				amount: amount,
				options: item.options ?? {},
			};
		});
	}

	/**
	 * Randomises items and returns array with specified size
	 * @param {number} size - Size of the array
	 * @returns {Array<ItemStack | null>}
	 */
	generate(size) {
		let step = 0;
		const array = new Array(size).fill(null).map((e, i) => {});
		return [];
	}
}

new LootTable(
	{
		id: "minecraft:diamond_sword",
		chance: "5%",
		amount: {
			0: "50%",
			1: "50%",
		},
		enchantments: {
			sharpness: {
				0: "40%",
				1: "50%",
				2: "10%",
			},
		},
	},
	{
		type: "apple",
		amount: 1,
		chance: "5%",
	}
);
