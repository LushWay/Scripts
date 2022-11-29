import { Location, Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { IS, setPlayerInterval, XA } from "xapi.js";
import { JOIN_EVENTS, __EMITTERS } from "./events.js";
import { CONFIG_JOIN, shortTime, timeNow } from "./var.js";

JOIN_EVENTS.playerJoin.subscribe((player) => {
	player.tell(`${timeNow()}, §b§l${player.name}!\n§r§9Время • ${shortTime()}`);
}, -1);

JOIN_EVENTS.playerGuide.subscribe((player) => {
	const f = new ActionFormData();
	f.title("Краткий гайд");
	f.body(
		`  ${timeNow()}, ${
			player.name
		}!\n  §7Для навигации по серверу используется §fменю§7 (зачарованный алмаз в инвентаре). Что бы открыть меню, возьми его в руку и §fиспользуй§7 (зажми на телефоне, ПКМ на пк)\n\n  Помимо него есть еще кастомные §fкоманды§7. Все они вводятся в чат и должны начинаться с '§f-§7'.\n  Что бы получить список всех доступных команд пропиши в чат §f-help§7.\n\n\n `
	);
	f.button("Oк!");
	f.show(player);
}, -1);

const KEY = {
	at: "join:at",
	stage: "join:stage",
	times: "join:times_count",
	seenLearning: "join:learned",
	seenMessage: "join:message",
};

/**
 *
 * @param {Player} player
 * @param {any} data
 * @param {"air" | "ground"} messageType
 */
function JOIN(player, data, messageType) {
	delete data[KEY.at];
	delete data[KEY.stage];

	data[KEY.times] = (data[KEY.times] ?? 0) + 1;

	for (const plr of world.getPlayers({ excludeTags: [CONFIG_JOIN.onJoin.excludeTag] })) {
		if (plr.id === player.id) continue;
		plr.playSound(CONFIG_JOIN.onJoin.sound);
		plr.tell(`§7${player.name} ${CONFIG_JOIN.onJoin[messageType]}`);
	}

	__EMITTERS.PlayerJoin.emit(player, 1);
	data[KEY.seenMessage] = 1;
	player.onScreenDisplay.clearTitle();
}

const WDB = new XA.instantDB(world, "pos");

world.events.playerJoin.subscribe((data) => {
	WDB.delete("J:" + data.player.id);
});

setPlayerInterval(
	async (player) => {
		const DB = new XA.cacheDB(player, "basic");
		const data = DB.data;

		if (!WDB.has("J:" + player.id)) {
			// New player (player joined)
			WDB.set("J:" + player.id, 1);
			data[KEY.at] = player.location.x + " " + player.location.y + " " + player.location.z;
			delete data[KEY.seenMessage];
		}

		// Pos where player joined
		const at = data[KEY.at];

		if (typeof at === "string") {
			const pos = at.split(" ").map(parseFloat);
			const not_moved = player.location.equals(new Location(pos[0], pos[1], pos[2]));

			if (not_moved) {
				// Player still stays at joined position...
				if (player.hasTag("on_ground")) {
					// Player doesnt falling down, show animation
					data[KEY.stage] = data[KEY.stage] ?? -1;
					data[KEY.stage]++;
					if (typeof data[KEY.stage] !== "number" || data[KEY.stage] >= CONFIG_JOIN.animation.stages.length)
						data[KEY.stage] = 0;

					// Creating title
					let title = CONFIG_JOIN.animation.stages[data[KEY.stage]];
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
			} else if (!data[KEY.seenMessage]) {
				// Player moved on ground
				JOIN(player, data, "ground");
			}
		}
		if (!data[KEY.seenLearning] && data[KEY.seenMessage]) {
			// Show fisrt join guide
			__EMITTERS.PlayerGuide.emit(player, 1);
			data[KEY.seenLearning] = 1;
		}
		DB.safe();
	},
	20,
	"joinInterval"
);

new XA.Command({
	name: "info",
	description: "Открывает гайд",
	/*type: "public"*/
}).executes((ctx) => {
	const DB = new XA.instantDB(ctx.sender, "basic");
	DB.delete(KEY.seenLearning);
});
new XA.Command({
	name: "join",
	requires: (p) => IS(p.id, "admin"),
	description: "Имитирует вход",
	/*type: "public"*/
}).executes((ctx) => {
	WDB.delete("J:" + ctx.sender.id);
});
