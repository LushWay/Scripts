import { system, world } from "@minecraft/server";
import { util } from "../Setup/utils.js";
import { MCApp } from "./mc.js";
MCApp.Route("test", (req) => req);

system.runTimeout(
	() => {
		MCApp.SendToNode("ping", "").then((e) =>
			world.debug("PING", util.inspect(e))
		);
	},
	"ping",
	100
);
