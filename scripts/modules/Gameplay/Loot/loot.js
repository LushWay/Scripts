import { ItemStack, MinecraftItemTypes } from "@minecraft/server";
import { getRandomiserForCost } from "../../../lib/Class/RandomCost.js";
import { MinecraftEnchantmentTypes } from "../../../lib/List/enchantments.js";

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
			const id = "type" in item ? MinecraftItemTypes[item.type] : item.id;
			if (typeof id !== "string")
				throw new TypeError(
					"Unknown item type: " + ("type" in item ? item.type : item.id)
				);

			/** @type {() => number} */
			let slot;
			item.slots ??= 0;
			if (typeof item.slots === "number") {
				// @ts-expect-error
				slot = function () {
					return item.slots;
				};
			} else slot = getRandomiserForCost(item.slots);

			/** @type {() => number} */
			let amount;
			item.amount ??= 0;
			if (typeof item.amount === "number") {
				// @ts-expect-error
				amount = function () {
					return item.amount;
				};
			} else amount = getRandomiserForCost(item.amount);

			/** @type {Record<string, () => number>} */
			const enchs = {};
			for (const [key, value] of Object.entries(item.enchantments)) {
				enchs[key] = getRandomiserForCost(value);
			}

			function enchantments() {
				/** @type {Record<string, number>} */
				const map = {};
				for (const [key, value] of Object.entries(enchs)) {
					map[key] = value();
				}
				return map;
			}

			// Due to JS engines object schemes we need to
			// specify all properties and nothing more
			return {
				id,
				slot,
				nameTag: item.nameTag ?? "",
				lore: item.lore,
				enchantments,
				amount,
				options: item.options ?? {},
			};
		});
	}

	/**
	 * Randomises items and returns array with specified szie
	 * @param {number} size - Size of the array
	 * @returns {Array<ItemStack | null>}
	 */
	generate(size) {
		this.items;
		return [];
	}
}

new LootTable(
	{
		id: "minecraft:diamond_sword",
		amount: {
			0: "1%",
			1: "1%",
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
	}
);
