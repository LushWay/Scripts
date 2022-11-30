import { DynamicPropertiesDefinition, MinecraftEntityTypes, world } from "@minecraft/server";

export const CONFIG_DB = {
	player: {
		basic: 0,
	},
	world: {
		player: 0,
		chests: 0,
		options: 0,
		region: 0,
		kits: 0,
		drop: 0,
		roles: 0,
		leaderboard: 0,
		basic: 0,
		buildRegion: 0,
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
	const size = v > 0 ? v : 4294967295;
	s.defineString(p, size);
}

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
	try {
		const e = new DynamicPropertiesDefinition();
		for (const prop in CONFIG_DB.world) add(e, prop, CONFIG_DB.world[prop]);
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
