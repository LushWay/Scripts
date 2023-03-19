import {
	Entity,
	ItemUseOnEvent,
	Player,
	world,
	World,
} from "@minecraft/server";
import { addMethod, editMethod } from "./patcher.js";
import { toStr } from "./utils.js";
export * as Prototypes from "./patcher.js";

Player.prototype.tell = Player.prototype.sendMessage;
World.prototype.say = World.prototype.sendMessage;

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

addMethod(JSON, "safeParse", (str, reviever, onError) => {
	try {
		return JSON.parse(str, reviever);
	} catch (e) {
		onError(e);
	}
});

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
