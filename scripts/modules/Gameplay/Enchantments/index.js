import { Enchantment } from "@minecraft/server";
import { EventSignal } from "../../../lib/Class/Events.js";

const ON_LOAD = new EventSignal();

export const Enchantments = {
	/**
	 * @type {{[key: string]: { [key: number]: Enchantment }}}
	 */
	Custom: {},

	/**
	 * @type {Record<keyof typeof MinecraftEnchantmentTypes, { [key: number]: Enchantment }>}
	 */
	// @ts-expect-error
	Typed: {},

	events: {
		onLoad: ON_LOAD,
	},
};

import { MinecraftItemTypes, Vector, world } from "@minecraft/server";
import { DB } from "lib/Database/Default.js";
import { DisplayError, toStr } from "xapi.js";
import { MinecraftEnchantmentTypes } from "../../../lib/List/enchantments.js";

const location = { x: 0, y: -10, z: 0 };

function load() {
	let status;
	try {
		status = world.overworld.runCommand(
			"structure load CustomEnchantments " + Vector.string(location)
		);
	} catch {}

	if (!status.successCount)
		return DisplayError(
			new Error(
				"Unable to load CustomEnchantments structure. Status: " + toStr(status)
			)
		);

	let entities = world.overworld.getEntities({
		type: DB.ENTITY_IDENTIFIER,
		location,
		maxDistance: 2,
	});

	const entity = entities[0];

	if (!entity)
		return DisplayError(new Error("Unable to found CustomEnchantments entity"));

	const inventory = entity.getComponent("inventory");
	const { container } = inventory;

	for (let i = 0; i < container.size; i++) {
		const item = container.getItem(i);
		if (item?.typeId !== MinecraftItemTypes.enchantedBook.id) break;

		const enchantments = item.getComponent("enchantments");
		if (!enchantments?.enchantments)
			return DisplayError(
				new Error(
					"Found unexpected enchantment type on slot " +
						i +
						". Enchantments: " +
						toStr(enchantments)
				)
			);

		for (const enchantment of enchantments.enchantments) {
			Enchantments.Custom[enchantment.type.id] ??= [
				null,
				new Enchantment(enchantment.type, 1),
			];
			Enchantments.Custom[enchantment.type.id][enchantment.level] = enchantment;
		}
	}

	world.overworld
		.getEntities({ type: DB.ENTITY_IDENTIFIER, location, maxDistance: 2 })
		.forEach((e) => e.triggerEvent("minecraft:despawn"));

	// @ts-expect-error
	Enchantments.Typed = Enchantments.Custom;

	EventSignal.emit(ON_LOAD, null);
}

load();
