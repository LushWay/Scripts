import { EntityDamageCause, GameMode, Player } from "@minecraft/server";
import { addMethod } from "../patcher.js";

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
	const { currentValue: current } = health;
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
	health.setCurrentValue(current);
	this.runCommand("stopsound @s game.player.hurt");

	// Return player back to creative mode
	if (isCreative) this.runCommand("gamemode c");

	return true;
});
