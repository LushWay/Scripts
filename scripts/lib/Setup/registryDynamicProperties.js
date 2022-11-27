import { DynamicPropertiesDefinition, MinecraftEntityTypes, world } from "@minecraft/server";

export const CONFIG_DB = {
	player: {
		basic: 2 ** 10,
	},
	world: {
		pos: 2 ** 10,
		chests: 2 ** 10,
		options: 2 ** 10,
		region: 2 ** 10,
		kits: 2 ** 10,
		chest: 2 ** 10,
		drop: 2 ** 10,
		roles: 2 ** 11,
		leaderboard: 2 ** 15,
		basic: 2 ** 10,
		buildRegion: 2 ** 11,
		speed_test: 0,
	},
};

/**
 *
 * @param {DynamicPropertiesDefinition} s
 * @param {string} p
 * @param {number} [v]
 * @returns
 */
function add(s, p, v) {
	s.defineString(p, v > 0 && v <= 4294967295 ? v : 4294967295);
}

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
	try {
		const e = new DynamicPropertiesDefinition();
		for (const prop in CONFIG_DB.world) add(e, prop);
		propertyRegistry.registerWorldDynamicProperties(e);
	} catch (e) {
		console.warn(e);
	}
});

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
	try {
		const e = new DynamicPropertiesDefinition();
		for (const prop in CONFIG_DB.player) add(e, prop);
		propertyRegistry.registerEntityTypeDynamicProperties(e, MinecraftEntityTypes.player);
	} catch (e) {
		console.warn(e);
	}
});
