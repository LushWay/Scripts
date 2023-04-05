import { Entity, EntityDamageCause, GameMode, Player } from "@minecraft/server";
import { addMethod, editMethod } from "../patcher.js";

/**
 * Player/Entity
 *
 *
 */

Player.prototype.tell = Player.prototype.sendMessage;

addMethod(
	Player.prototype,
	"applyDash",
	(target, horizontalStrength, verticalStrength) => {
		const view = target.getViewDirection();
		const hStrength = Math.sqrt(view.x ** 2 + view.z ** 2) * horizontalStrength;
		const vStrength = view.y * verticalStrength;
		target.applyKnockback(view.x, view.z, hStrength, vStrength);
	}
);

/**
 *
 * @param {{original: Entity["teleport"], args: Parameters<Entity["teleport"]>, context: Entity}} param0
 * @returns
 */
function teleport({
	original,
	args: [location, dimension, xRot, yRot, keepVelocity],
	context,
}) {
	if (typeof xRot === "undefined" || typeof yRot === "undefined") {
		const rotation = context.getRotation();
		xRot = rotation.x;
		yRot = rotation.y;
	}

	keepVelocity ??= false;
	dimension ??= context.dimension;

	return original(location, dimension, xRot, yRot, keepVelocity);
}

editMethod(Player.prototype, "teleport", teleport);
editMethod(Entity.prototype, "teleport", teleport);

addMethod(Player.prototype, "isGamemode", function (mode) {
	return !!this.dimension
		.getPlayers({
			location: this.location,
			maxDistance: 1,
			gameMode: GameMode[mode],
		})
		.find((e) => e.id === this.id);
});

addMethod(Player.prototype, "closeChat", function (message) {
	const health = this.getComponent("health");
	const { current } = health;
	if (current <= 1) {
		if (message) this.tell(message);
		return false;
	}

	// We need to switch player to gamemode where we can apply damage to them
	const isCreative = this.isGamemode("creative");
	if (isCreative) this.runCommand("gamemode s");

	this.applyDamage(1, {
		cause: EntityDamageCause.entityAttack,
	});
	health.setCurrent(current);
	this.runCommand("stopsound @s game.player.hurt");

	// Return player back to creative mode
	if (isCreative) this.runCommand("gamemode c");

	return true;
});
