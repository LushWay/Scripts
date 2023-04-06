import {
	Enchantment,
	MinecraftItemTypes,
	Vector,
	world,
} from "@minecraft/server";
import { DB } from "lib/Database/Default.js";
import { DisplayError, toStr } from "xapi.js";
import { CustomEnchantments } from "./var.js";

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
		if (item?.typeId !== MinecraftItemTypes.enchantedBook.id) return;

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
			CustomEnchantments[enchantment.type.id] ??= [];
			CustomEnchantments[enchantment.type.id][enchantment.level] = enchantment;
		}
	}

	entity.triggerEvent("despawn");

	for (const key in CustomEnchantments)
		CustomEnchantments[key][1] = new Enchantment(
			CustomEnchantments[key][2].type,
			1
		);
}

load();
