import { MinecraftDimensionTypes, World, world } from "@minecraft/server";
import { OverTakes } from "../prototypes.js";
import { util } from "../utils.js";

const send = world.sendMessage.bind(world);

/**
 * @type {World["sendMessage"]}
 */
let say = (message) => {
	if (typeof message === "string" && !message.startsWith("§9"))
		message = "§9│ " + message.replace(/\n/g, "\n§9│ §r");

	if (globalThis.XA?.state?.loadTime) say = send;

	send(message);
};

OverTakes(World.prototype, {
	say,
	overworld: world.getDimension(MinecraftDimensionTypes.overworld),
	nether: world.getDimension(MinecraftDimensionTypes.nether),
	end: world.getDimension(MinecraftDimensionTypes.theEnd),
	debug(...data) {
		say(
			data
				.map((/**@type {*}*/ e) =>
					typeof e === "string" ? e : util.inspect(e)
				)
				.join(" ")
		);
	},
	logOnce(name, ...data) {
		if (LOGS.has(name)) return;
		world.debug(...data);
		LOGS.add(name);
	},
});

const LOGS = new Set();
