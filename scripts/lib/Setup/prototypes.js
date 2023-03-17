import { Player, world, World } from "@minecraft/server";
import { addMethod, editMethod } from "./patcher.js";
import { toStr } from "./utils.js";
export * as Prototypes from "./patcher.js";

Player.prototype.tell = Player.prototype.sendMessage;
World.prototype.say = World.prototype.sendMessage;

const originalSay = world.sendMessage.bind(world);

addMethod(World.prototype, "debug", (...data) => {
	originalSay(data.map((e) => toStr(e)).join(" "));
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
