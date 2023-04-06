import { Entity, system, Vector, world } from "@minecraft/server";
import { XA } from "xapi.js";
import { NAME_MODIFIERS } from "./var.js";

/** @type {Record<string, {hurt_entity: string, hurt_type: string, indicator: string, damage: number}>} */
const HURT_ENTITIES = {};
const INDICATOR_TAG = "HEALTH_INDICATOR";

// Entities that have nameTag "always_show": true
const ALWAYS_SHOWS = [
	//"minecraft:warden",
	"minecraft:player",
];

// Kill previosly used entities
getIndicators().forEach((e) => {
	e.teleport({ x: 0, y: -64, z: 0 });
	e.triggerEvent("f:t:kill");
});

world.events.entityHurt.subscribe((data) => {
	if (data.hurtEntity.id === "f:t") return;

	const hp = data.hurtEntity.getComponent("health");
	if (data.damage >= hp.current) return;

	const { indicator, same } = getIndicator(data.hurtEntity);

	HURT_ENTITIES[data.hurtEntity.id].damage = data.damage;
	indicator.nameTag = getName(data.hurtEntity, hp);

	if (!same)
		indicator.teleport(
			Vector.add(data.hurtEntity.getHeadLocation(), { x: 0, y: 1, z: 0 })
		);
});

world.events.entityDie.subscribe((data) => {
	if (data.deadEntity.id === "f:t") return;
	if (!(data.deadEntity.id in HURT_ENTITIES)) return;

	const { indicator, same } = getIndicator(data.deadEntity);

	if (!same) {
		indicator.teleport({ x: 0, y: -64, z: 0 });
		indicator.triggerEvent("f:t:kill");
	}

	delete HURT_ENTITIES[data.deadEntity.id];
});

system.runInterval(
	() => {
		for (const [id, info] of Object.entries(HURT_ENTITIES)) {
			const entity = world.overworld
				.getEntities({
					type: info.hurt_type,
				})
				.find((e) => e.id === id);

			if (!entity) {
				getIndicators()
					.find((e) => e.id === info.indicator)
					?.kill();

				delete HURT_ENTITIES[id];
				continue;
			}

			const { indicator, same } = getIndicator(entity);

			indicator.nameTag = getName(entity);
			if (!same)
				indicator.teleport(
					Vector.add(entity.getHeadLocation(), { x: 0, y: 1, z: 0 })
				);
		}
	},
	"hurt indicator",
	0
);

system.runInterval(
	() => {
		for (const id in HURT_ENTITIES) {
			const damage = HURT_ENTITIES[id].damage;
			if (damage > 0) HURT_ENTITIES[id].damage -= damage / 2;
		}
	},
	"damage counter",
	20
);

let stat = false;
new XA.Command({ name: "dmgstat", role: "admin" }).executes(
	() => (stat = true)
);

/**
 * Gets damage indicator name depending on entity's currnet heart and damage applied
 * @param {Entity} entity
 * @returns {string}
 */
function getName(entity, hp = entity.getComponent("health")) {
	const maxHP = hp.value;

	const scale = maxHP <= 50 ? 1 : maxHP / 50;

	const full = ~~(maxHP / scale);
	const current = ~~(hp.current / scale);
	const damage = ~~(HURT_ENTITIES[entity.id].damage / scale);

	const health_bar = new Array(full)
		.fill("§c", 0, current)
		.fill("§6", current + 1, current + damage + 1)
		.fill("§7", current + damage + 2, full)
		.join("|");

	if (stat) {
		stat = false;
		world.debug("a", {
			health_bar,
			damage,
			current,
			full,
			scale,
			maxHP,
			e: entity.typeId,
		});
	}

	return (
		"§c" +
		health_bar +
		NAME_MODIFIERS.map((modifier) => modifier(entity))
			.filter((result) => result !== false)
			.join("")
	);
}

/**
 *
 * @param {Entity} entity
 * @param {number} damage
 */
function getIndicator(entity, damage = 0) {
	if (stat) world.debug(entity.typeId);
	if (ALWAYS_SHOWS.includes(entity.typeId)) {
		HURT_ENTITIES[entity.id] ??= {
			damage,
			hurt_entity: entity.id,
			hurt_type: entity.typeId,
			indicator: "NULL",
		};

		return { indicator: entity, same: true };
	}

	if (entity && entity.id in HURT_ENTITIES) {
		const indi_id = HURT_ENTITIES[entity.id].indicator;
		const indicator = getIndicators().find((e) => e && e.id === indi_id);

		return { indicator: indicator ?? createIndicator(entity), same: false };
	}

	return { indicator: createIndicator(entity), same: false };
}

/**
 *
 * @param {Entity} entity
 */
function createIndicator(entity) {
	const indicator = entity.dimension.spawnEntity(
		"f:t",
		entity.getHeadLocation()
	);

	indicator.nameTag = "Loading...";
	indicator.addTag(INDICATOR_TAG);

	HURT_ENTITIES[entity.id] = {
		hurt_entity: entity.id,
		damage: 100,
		hurt_type: entity.typeId,
		indicator: indicator.id,
	};

	return indicator;
}

function getIndicators() {
	return world.overworld.getEntities({
		type: "f:t",
		tags: [INDICATOR_TAG],
	});
}
