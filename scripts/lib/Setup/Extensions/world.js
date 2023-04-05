import { MinecraftDimensionTypes, World, world } from "@minecraft/server";
import { addMethod } from "../patcher.js";
import { toStr } from "../utils.js";

const send = world.sendMessage.bind(world);

/**
 * @type {World["sendMessage"]}
 */
let say = (message) => {
	if (typeof message === "string" && !message.startsWith("§9"))
		message = "§9│ " + message.replace(/\n/g, "\n§9│ §r");

	if (globalThis.XA?.state?.load_time) say = send;

	send(message);
};

World.prototype.say = say;

World.prototype.overworld = world.getDimension(
	MinecraftDimensionTypes.overworld
);
World.prototype.nether = world.getDimension(MinecraftDimensionTypes.nether);
World.prototype.end = world.getDimension(MinecraftDimensionTypes.theEnd);

addMethod(World.prototype, "debug", (...data) => {
	say(
		data
			.map((/** @type {*} */ e) => (typeof e === "string" ? e : toStr(e)))
			.join(" ")
	);
});

const LOGS = new Set();

addMethod(World.prototype, "logOnce", (name, ...data) => {
	if (LOGS.has(name)) return;
	world.debug(...data);
	LOGS.add(name);
});
