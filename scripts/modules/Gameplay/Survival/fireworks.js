import {
	Entity,
	MinecraftEntityTypes,
	MinecraftItemTypes,
	Player,
	Vector,
	World,
	system,
	world,
} from "@minecraft/server";

/** @type {Record<string, [number, Entity]>} */
const SPAWNED_FIREWORKS = {};

world.afterEvents.entitySpawn.subscribe((data) => {
	if (data.entity.typeId !== MinecraftEntityTypes.fireworksRocket.id) return;

	SPAWNED_FIREWORKS[data.entity.id] = [Date.now(), data.entity];
});

world.afterEvents.itemUse.subscribe((data) => {
	if (data.itemStack.typeId !== MinecraftItemTypes.crossbow.id) return;
	if (!(data.source instanceof Player)) return;

	for (const [id, [date, entity]] of Object.entries(SPAWNED_FIREWORKS)) {
		if (
			Date.now() - date < 5 &&
			Vector.distance(data.source.location, entity.location) < 2
		) {
			delete SPAWNED_FIREWORKS[id];
			FIREWORKS[id] = { source: data.source, firework: entity };
			break;
		}
	}
});

/** @type {Record<string, {source: Player, firework: Entity}>} */
const FIREWORKS = {};

system.runInterval(
	() => {
		for (const [id, { source, firework }] of Object.entries(FIREWORKS)) {
			let velocity;
			try {
				velocity = Vector.floor(firework.getVelocity());
			} catch (e) {
				delete FIREWORKS[id];
				continue;
			}

			const block = firework.dimension.getBlock(
				Vector.add(firework.location, firework.getViewDirection())
			);

			if (block && !block.isAir()) {
				firework.dimension.createExplosion(firework.location, 4, {
					source,
					breaksBlocks: true,
				});
				delete FIREWORKS[id];
			}
		}
	},
	"firework boom",
	10
);
