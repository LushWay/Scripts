import { ItemUseOnEvent, Vector, world } from "@minecraft/server";
import { toStr } from "./lib/Setup/utils.js";

world.debug = (...data) => {
	world.sendMessage(data.map((/** @type {*} */ e) => toStr(e)).join(" "));
};

Reflect.defineProperty(ItemUseOnEvent.prototype, "blockLocation", {
	get() {
		this.location ??= this.getBlockLocation();
		return this.location;
	},
	configurable: false,
	enumerable: true,
});

world.events.beforeItemUseOn.subscribe((data) => {
	world.debug(
		data.blockLocation,
		Vector.add(data.blockLocation, { z: 1, y: 1, x: 1 })
	);
});