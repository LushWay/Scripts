import { Player, world } from "@minecraft/server";
import { IS, setPlayerInterval, XA } from "xapi.js";
import { __EMITTERS } from "./events.js";
import { CONFIG_JOIN } from "./var.js";
import "./subscribes.js";

const PDB = XA.tables.player;

/**
 *
 * @param {Player | string} player
 * @returns
 */
function getKey(player) {
	return `JOIN:${player instanceof Player ? player.id : player}`;
}

/**
 *
 * @param {Player | string} player
 * @returns {IJoinData}
 */
function getData(player) {
	return XA.tables.player.get(getKey(player)) ?? {};
}
/**
 *
 * @param {Player | string} player
 * @param {IJoinData} data
 * @returns
 */
function setData(player, data) {
	return XA.tables.player.set(getKey(player), data);
}

const getSettings = XA.PlayerOptions("join", {
	message: { desc: "Сообщения о входе других игроков", value: true },
	sound: { desc: "Звук входа других игроков", value: true },
});

/**
 *
 * @param {Player} player
 * @param {IJoinData} data
 * @param {"air" | "ground"} messageType
 */
function JOIN(player, data, messageType) {
	delete data.at;
	delete data.stage;

	data.times = (data.times ?? 0) + 1;

	for (const plr of world.getPlayers()) {
		if (plr.id === player.id) continue;
		const settings = getSettings(plr);
		if (settings.sound) plr.playSound(CONFIG_JOIN.onJoin.sound);
		if (settings.message) plr.tell(`§7${player.name} ${CONFIG_JOIN.onJoin[messageType]}`);
	}

	__EMITTERS.PlayerJoin.emit(player, 1);
	data.message = 1;
	player.onScreenDisplay.clearTitle();

	const oldTag = PDB.get("NAME:" + player.id);

	if (oldTag === player.name) return;
	if (oldTag && oldTag !== player.name) {
		world.say("§c> §3Игрок §f" + oldTag + " §r§3сменил ник на §f" + player.name);
	}

	PDB.set("NAME:" + player.id, player.name);
}

world.events.playerJoin.subscribe((data) => {
	const D = getData(data.player);
	delete D?.waiting;
	setData(data.player, D);
});

setPlayerInterval(
	(player) => {
		const data = getData(player);

		if (!data.waiting) {
			// New player (player joined)
			data.waiting = 1;
			data.at = player.location.x + " " + player.location.y + " " + player.location.z;
			delete data.message;
		}

		// Pos where player joined
		const at = data.at;

		if (typeof at === "string") {
			const pos = at.split(" ").map(parseFloat);
			const not_moved = player.location.x === pos[0] && player.location.y === pos[1] && player.location.z === pos[2];

			if (not_moved) {
				// Player still stays at joined position...
				if (player.hasTag("on_ground")) {
					// Player doesnt falling down, show animation
					data.stage = data.stage ?? -1;
					data.stage++;
					if (typeof data.stage !== "number" || data.stage >= CONFIG_JOIN.animation.stages.length) data.stage = 0;

					// Creating title
					let title = CONFIG_JOIN.animation.stages[data.stage];
					for (const key in CONFIG_JOIN.animation.vars) {
						title = title.replace("$" + key, CONFIG_JOIN.animation.vars[key]);
					}

					// Show actionBar
					if (CONFIG_JOIN.actionBar) player.onScreenDisplay.setActionBar(CONFIG_JOIN.actionBar);

					// Title + subtitle
					/** @type {import("@minecraft/server").TitleDisplayOptions} */
					const options = {
						fadeInSeconds: 0,
						fadeOutSeconds: 1,
						staySeconds: 2,
					};
					if (CONFIG_JOIN.subtitle) options.subtitle = CONFIG_JOIN.subtitle;
					// Show...
					player.onScreenDisplay.setTitle(title, options);
				} else {
					// Player joined in air
					JOIN(player, data, "air");
				}
			} else if (!data.message) {
				// Player moved on ground
				JOIN(player, data, "ground");
			}
		}
		if (!data.learning && data.message) {
			// Show fisrt join guide
			__EMITTERS.PlayerGuide.emit(player, 1);
			data.learning = 1;
		}
		setData(player, data);
	},
	20,
	"joinInterval"
);

new XA.Command({
	name: "info",
	description: "Открывает гайд",
	type: "public",
}).executes((ctx) => {
	const D = getData(ctx.sender);
	delete D?.learning;
	setData(ctx.sender, D);
});
new XA.Command({
	name: "join",
	requires: (p) => IS(p.id, "admin"),
	description: "Имитирует вход",
	type: "public",
}).executes((ctx) => {
	const D = getData(ctx.sender);
	delete D?.waiting;
	setData(ctx.sender, D);
});
