import { world, World } from "@minecraft/server";
import { addMethod, editMethod } from "./patcher.js";
import { toStr } from "./utils.js";
export * as Prototypes from "./patcher.js";

const originalSay = world.say.bind(world);
addMethod("to prototype in", World, "debug", (...data) => {
	originalSay(data.map((e) => toStr(e)).join(" "));
});

const LOGS = [];
addMethod("to prototype in", World, "logOnce", (name, ...data) => {
	if (LOGS.includes(name)) return;
	world["debug"](...data);
	LOGS.push(name);
});

addMethod("to", JSON, "safeParse", (str, reviever, onError) => {
	try {
		JSON.parse(str, reviever);
	} catch (e) {
		onError(e);
	}
});
