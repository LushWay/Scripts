import {MinecraftEffectTypes, world} from "@minecraft/server";
import {awaitWorldLoad, setPlayerInterval, ThrowError, XA} from "xapi.js";

const DB = XA.tables.basic;
const key = "server.type";

const VALUE = {
	0: "build",
	1: "survival",
};
const toDefault = () => {
	DB.set(key, 0);
	return 0;
};

world.events.playerSpawn;
(async () => {
	await awaitWorldLoad();
	/** @type {"build" | "survival"} */
	const type = VALUE[DB.get(key) ?? toDefault()];

	if (type !== "build" && type !== "survival") {
		toDefault();
		ThrowError(new TypeError("Invalid region type: " + type));
	}

	if (type === "build") import("./Build/index.js");
	else if (type === "survival") import("./Survival/index.js");
})();

const EFFECT_Y = -55;
const TP_Y = -63;
const TP_TO = TP_Y + 5;

setPlayerInterval(
	player => {
		const loc = player.location;
		const rotation = player.rotation;
		if (loc.y >= EFFECT_Y + 1) return;
		if (loc.y < EFFECT_Y)
			player.addEffect(MinecraftEffectTypes.levitation, 3, 5, false);
		if (loc.y < TP_Y)
			player.teleport(
				{x: loc.x, y: TP_TO, z: loc.z},
				player.dimension,
				rotation.x,
				rotation.y
			);
	},
	0,
	"underground effects"
);
