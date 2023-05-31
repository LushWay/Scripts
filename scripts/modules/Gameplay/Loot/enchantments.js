import {
	Enchantment,
	MinecraftItemTypes,
	Vector,
	world,
} from "@minecraft/server";
import { DB, EventSignal, util } from "xapi.js";
import { MinecraftEnchantmentTypes } from "../../../lib/List/enchantments.js";

const ON_LOAD = new EventSignal();
const LOCATION = { x: 0, y: -10, z: 0 };

export const Enchantments = {
	/**
	 * @type {{[key: string]: { [key: number]: Enchantment }}}
	 */
	custom: {},

	/**
	 * @type {Record<keyof typeof MinecraftEnchantmentTypes, { [key: number]: Enchantment }>}
	 */
	// @ts-expect-error
	typed: {},

	events: {
		onLoad: ON_LOAD,
	},
};

function load() {
	let status;
	status = world.overworld.runCommand(
		"structure load CustomEnchantments " + Vector.string(LOCATION)
	);

	if (!status)
		return util.error(
			new Error(
				"Unable to load CustomEnchantments structure. Status: " +
					util.inspect(status)
			)
		);

	let entities = world.overworld.getEntities({
		type: DB.ENTITY_IDENTIFIER,
		location: LOCATION,
		maxDistance: 2,
	});

	const entity = entities[0];

	if (!entity)
		return util.error(new Error("Unable to found CustomEnchantments entity"));

	const inventory = entity.getComponent("inventory");
	const { container } = inventory;

	for (let i = 0; i < container.size; i++) {
		const item = container.getItem(i);
		if (item?.typeId !== MinecraftItemTypes.enchantedBook.id) break;

		const enchantments = item.getComponent("enchantments");
		if (!enchantments?.enchantments)
			return util.error(
				new Error(
					"Found unexpected enchantment type on slot " +
						i +
						". Enchantments: " +
						util.inspect(enchantments)
				)
			);

		for (const enchantment of enchantments.enchantments) {
			Enchantments.custom[enchantment.type.id] ??= [
				null,
				new Enchantment(enchantment.type, 1),
			];
			Enchantments.custom[enchantment.type.id][enchantment.level] = enchantment;
		}
	}

	world.overworld
		.getEntities({
			type: DB.ENTITY_IDENTIFIER,
			location: LOCATION,
			maxDistance: 2,
		})
		.forEach((e) => e.triggerEvent("minecraft:despawn"));

	// @ts-expect-error
	Enchantments.typed = Enchantments.custom;

	EventSignal.emit(ON_LOAD, null);
}

load();
