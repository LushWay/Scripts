import { world, World } from "@minecraft/server";
import { addMethod, editMethod } from "./patcher.js";
import { toStr } from "./utils.js";
export * as Prototypes from "./patcher.js";

const originalSay = world.say.bind(world);
addMethod(World.prototype, "debug", (...data) => {
	originalSay(data.map((e) => toStr(e)).join(" "));
});

const LOGS = new Set();
addMethod(World.prototype, "logOnce", (name, ...data) => {
	if (LOGS.has(name)) return;
	world["debug"](...data);
	LOGS.add(name);
});

addMethod(JSON, "safeParse", (str, reviever, onError) => {
	try {
		JSON.parse(str, reviever);
	} catch (e) {
		onError(e);
	}
});
