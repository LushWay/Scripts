import { DynamicPropertiesDefinition, EntityTypes, MinecraftEntityTypes, world } from "@minecraft/server";

export const CONFIG_DB = {
	player: {
		basic: 980,
	},
	world: {
		player: 1000,
		chests: 100,
		options: 1000,
		region: 1000,
		kits: 100,
		drop: 10,
		roles: 1000,
		leaderboard: 100,
		basic: 1000,
		buildRegion: 1000,
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
		for (const prop in CONFIG_DB.player) add(e, prop, CONFIG_DB.player[prop]);
		propertyRegistry.registerEntityTypeDynamicProperties(e, MinecraftEntityTypes.player);
	} catch (e) {
		console.warn(e);
	}
});

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
	try {
		const e = new DynamicPropertiesDefinition();
		e.defineNumber("index");
		e.defineString("name", 16);
		propertyRegistry.registerEntityTypeDynamicProperties(e, EntityTypes.get("rubedo:database"));
	} catch (e) {
		console.warn(e);
	}
});
