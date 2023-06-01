import {
	ItemStack,
	ItemTypes,
	MinecraftItemTypes,
	world,
} from "@minecraft/server";
import { RandomCost } from "../../../lib/Class/RandomCost.js";
import { Enchantments } from "./enchantments.js";

export class LootTable {
	/**
	 * Stored items
	 * @type {Array<import("./types.js").LootItem.Stored & import("./types.js").LootItem.Stored>}
	 */
	items;

	totalChance = 0;

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
			for (const [key, value] of Object.entries(item.enchantments ?? {})) {
				enchantments[key] = RandomCost.toArray(value);
			}

			const chance = parseInt(item.chance);
			if (isNaN(chance)) throw new TypeError("Chance must be `{number}%`");
			this.totalChance += chance;

			/** @type {import("./types.js").LootItem.Options<number[]>} */
			const options = Object.assign(item?.options ?? {});
			if (item.options?.damage) {
				options.damage = RandomCost.toArray(item.options.damage);
			}

			return {
				id: id,
				chance: chance,
				nameTag: item.nameTag ?? "",
				lore: item.lore ?? [],
				enchantments: enchantments,
				amount: amount,
				options: options ?? {},
			};
		});
	}

	/**
	 * Randomises items and returns array with specified size
	 * @param {number} size - Size of the array
	 * @param {percent} air
	 * @returns {Array<ItemStack | null>}
	 */
	generate(size, air = "70%") {
		let step = 0;
		const stepMax = ~~(size * (parseInt(air) / 100));
		world.debug({ stepMax });

		return new Array(size).fill(null).map(() => {
			// Select air between items
			if (step > 0) {
				step--;
				return null;
			}

			step = Math.randomInt(0, stepMax);

			// Get random item depends on chance
			let random = Math.randomInt(0, this.totalChance);
			/**
			 * @type {import("./types.js").LootItem.Stored}
			 */
			let item;

			for (const current of this.items) {
				random -= current.chance;

				if (0 > random) {
					item = current;
					break;
				}
			}

			// Randomise item properties
			const amount = item.amount.randomElement();
			if (amount <= 0) return;

			const stack = new ItemStack(item.id, amount);

			const { enchantments } = stack.enchantments;
			for (const [name, levels] of Object.entries(item.enchantments)) {
				const level = levels.randomElement();
				if (!level) continue;
				enchantments.addEnchantment(Enchantments.custom[name][level]);
			}
			stack.enchantments.enchantments = enchantments;

			const {
				canDestroy,
				canPlaceOn,
				damage: durability,
				lockMode,
				keepOnDeath,
			} = item.options;

			if (item.nameTag) stack.nameTag = item.nameTag;
			if (item.lore.length) stack.setLore(item.lore);

			if (keepOnDeath) stack.keepOnDeath = true;
			if (lockMode) stack.lockMode = lockMode;
			if (canDestroy?.length) stack.setCanDestroy(canDestroy);
			if (canPlaceOn?.length) stack.setCanPlaceOn(canPlaceOn);
			if (durability?.length) {
				const damage = durability.randomElement();
				if (damage) stack.durability.damage = damage;
			}

			return stack;
		});
	}
}

const table = new LootTable(
	{
		id: "minecraft:diamond_sword",
		chance: "40%",
		amount: {
			0: "50%",
			1: "50%",
		},
		enchantments: {
			sharpness: {
				0: "40%",
				"1...2": "50%",
				"3...5": "10%",
			},
		},
		options: {
			damage: {
				0: "20%",
				40: "60%",
			},
		},
	},
	{
		type: "apple",
		amount: {
			"1...40": "6%",
			"41...64": "1%",
		},
		chance: "50%",
	}
);

new XCommand({
	name: "loott",
	role: "admin",
}).executes((ctx) => {
	const { container } = ctx.sender.getComponent("inventory");
	const gen = table.generate(container.size, "30%");
	for (const [i, item] of gen.entries()) {
		container.setItem(i, item);
	}
});
