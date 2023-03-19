import { Entity, world } from "@minecraft/server";

/** @type {Record<string, Entity>} */
const FLOATING_TEXTS = {};
/** @type {Record<string, Entity>} */
const HURT_ENTITIES = {};

world.events.entityHurt.subscribe((data) => {});

/**
 * Gets damage indicator name depending on entity's currnet heart and damage applied
 * @param {Entity} entity
 * @param {number} damage
 */
function getName(entity, damage) {
	const hp = entity.getComponent("health");
}
