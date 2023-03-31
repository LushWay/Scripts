import {
	Entity,
	EntityDamageCause,
	GameMode,
	ItemUseOnEvent,
	Player,
	Vector,
	world,
	World,
} from "@minecraft/server";
import { addMethod, editMethod } from "./patcher.js";
import { toStr } from "./utils.js";
export * as Prototypes from "./patcher.js";

World.prototype.say = World.prototype.sendMessage;
Player.prototype.tell = Player.prototype.sendMessage;

const originalSay = world.sendMessage.bind(world);

addMethod(World.prototype, "debug", (...data) => {
	originalSay(data.map((/** @type {*} */ e) => toStr(e)).join(" "));
});

const LOGS = new Set();

addMethod(World.prototype, "logOnce", (name, ...data) => {
	if (LOGS.has(name)) return;
	world.debug(...data);
	LOGS.add(name);
});

/**
 * Player/Entity
 *
 *
 */

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

Reflect.defineProperty(ItemUseOnEvent.prototype, "blockLocation", {
	get() {
		this.location ??= this.getBlockLocation();
		return this.location;
	},
	configurable: false,
	enumerable: true,
});

editMethod(console, "warn", ({ original, args }) => {
	original(...args.map((e) => toStr(e)));
});

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

/**
 * Vector
 *
 *
 *
 */

addMethod(Vector, "foreach", function* (a, b) {
	const [xmin, xmax] = a.x < b.x ? [a.x, b.x] : [b.x, a.x];
	const [ymin, ymax] = a.y < b.y ? [a.y, b.y] : [b.y, a.y];
	const [zmin, zmax] = a.z < b.z ? [a.z, b.z] : [b.z, a.z];
	for (let x = xmin; x <= xmax; x++) {
		for (let y = ymin; y <= ymax; y++) {
			for (let z = zmin; z <= zmax; z++) {
				yield { x, y, z };
			}
		}
	}
});

addMethod(Vector, "size", function (a, b) {
	// Each "max vector axis" - "min vector axis" + 1 * other axises
	return (
		((b.x > a.x ? b.x - a.x : a.x - b.x) + 1) *
		((b.y > a.y ? b.y - a.y : a.y - b.y) + 1) *
		((b.z > a.z ? b.z - a.z : a.z - b.z) + 1)
	);
});

addMethod(Vector, "floor", function (loc) {
	return { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) };
});

addMethod(Vector, "between", function (a, b, c) {
	return (
		c.x >= (a.x < b.x ? a.x : b.x) &&
		c.x <= (a.x > b.x ? a.x : b.x) &&
		c.y >= (a.y < b.y ? a.y : b.y) &&
		c.y <= (a.y > b.y ? a.y : b.y) &&
		c.z >= (a.z < b.z ? a.z : b.z) &&
		c.z <= (a.z > b.z ? a.z : b.z)
	);
});

/**
 * Common JavaScript objects
 *
 *
 */

addMethod(Function.prototype, "typedBind", function (context) {
	return this.bind(context);
});

addMethod(JSON, "safeParse", (str, reciever, onError) => {
	try {
		return JSON.parse(str, reciever);
	} catch (e) {
		onError(e);
	}
});

