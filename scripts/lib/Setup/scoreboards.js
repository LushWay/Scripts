import { world } from "@minecraft/server";
import { XA } from "xapi.js";

for (const { id, name, watch } of XA.objectives) {
	try {
		world.scoreboard.addObjective(id, name ?? id);
		if (watch) world.say("§cAdded objective with id " + id);
	} catch (e) {}
}

