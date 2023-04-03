import { ItemUseOnEvent, world } from "@minecraft/server";

world.debug = (...data) => {
	world.sendMessage(
		data.map((/** @type {*} */ e) => JSON.stringify(e)).join(" ")
	);
};

const err = console.error;
console.error = (...data) => {
	err(data.map((/** @type {*} */ e) => JSON.stringify(e)).join(" "));
};

Reflect.defineProperty(ItemUseOnEvent.prototype, "blockLocation", {
	get() {
		this.location ??= this.getBlockLocation();
		return this.location;
	},
	configurable: false,
	enumerable: true,
});

world.events.entityHurt.subscribe(
	(data) => {
		const entity = data.hurtEntity;
		world.debug(
			"hurt",
			entity.hasComponent("minecraft:health") &&
				entity.getComponent("minecraft:health").current <= 0
		);
	},
	{ entityTypes: ["minecraft:player"] }
);

world.events.entityHit.subscribe(
	() => {
		world.debug("hit");
	}
	// { entityTypes: ["minecraft:player"] }
);

world.events.entityDie.subscribe(
	() => {
		world.debug("die");
	},
	{ entityTypes: ["minecraft:player"] }
);

world.events.playerSpawn.subscribe(() => {
	world.debug("playerSpawn");
});
