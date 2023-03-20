import { Entity, Player } from "@minecraft/server";

/**
 * @type {((entity: Entity) => string | false)[]}
 */
export const NameModifiers = [
	(entity) => {
		if (!(entity instanceof Player)) return false;

		return `\n${entity.name}`;
	},
];
