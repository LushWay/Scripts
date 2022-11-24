import { Location } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { setPlayerInterval, XA } from "xapi.js";
import { wo } from "../../lib/Class/XOptions.js";
import { CONFIG_JOIN, timeNow } from "./var.js";

const KEY = {
	at: "join:at",
	stage: "join:stage",
	times: "join:times_count",
};

setPlayerInterval(async (player) => {
	const DB = new XA.cacheDB(player, "basic"),
		data = DB.data;
	/** @type {import("@minecraft/server").IVec3} */
	const at = data[KEY.at];

	if (typeof at === "object") {
		const message = CONFIG_JOIN.message(player);
		const not_moved = player.location.equals(new Location(at.x, at.z, at.y));

		if (not_moved) {
			if (player.hasTag("on_ground")) {
				const q = Number(data[KEY.stage]);
				const co = CONFIG_JOIN.animaton.color;
				let start = `${co}» `;
				let end = ` ${co}«`;
				if (q <= 5) {
					start += " ";
					end = ` ${end}`;
				}
				player.runCommandAsync("title @s times 0 120 0");
				player.onScreenDisplay.setActionBar(CONFIG_JOIN.actionBar);
				player.onScreenDisplay.setTitle(`${start}${CONFIG_JOIN.title}${end}`, {
					fadeInSeconds: 0,
					fadeOutSeconds: 1,
					staySeconds: 2,
					subtitle: CONFIG_JOIN.subtitle,
				});

				q == 0 ? (data[KEY.stage] = 10) : (data[KEY.stage] -= 2);
			} else {
				delete data[KEY.at];
				delete data[KEY.stage];

				data[KEY.times] = (data[KEY.times] ?? 0) + 1;

				[
					`tellraw @a[tag=!"another:join:disable",name=!"${player.name}"] {"rawtext":[{"translate":"§7${player.name} §8Очнулся в воздухе"}]}`,
					`scoreboard players add "${player.name}" join 1`,
					`playsound break.amethyst_cluster @a[tag=!"joinsound:disable"]`,
				].forEach((e) => XA.runCommand(e));
				player.tell(message);
				player.addTag("WSeenJoinMessage");
				player.runCommand("title @s clear");
			}
		} else if (!player.hasTag("WSeenJoinMessage")) {
			XA.Entity.removeTagsStartsWith(player, "joinedAt:");
			[
				`tellraw @a[tag=!"another:join:disable",name=!"${player.name}"] {"rawtext":[{"translate":"§7${player.name} §8Сдвинулся"}]}`,
				`playsound break.amethyst_cluster @a[tag=!"joinsound:disable"]`,
				`scoreboard players add "${player.name}" join 1`,
			].forEach((e) => XA.runCommand(e));
			player.tell(message);
			player.addTag("WSeenJoinMessage");
			player.runCommand("title @s clear");
		}
	}
	if (!player.hasTag("WSeenLearning") && player.hasTag("WSeenJoinMessage")) {
		const f = new ActionFormData();
		f.title("Краткий гайд");
		f.body(
			wo.G("joinform:body")?.replace("$name", player.name)?.replace("$time", timeNow()) ??
				`${timeNow()}, ${
					player.name
				}!\n§7Для навигации по серверу используется §fменю§7 (зачарованный алмаз в инвентаре).\n  Что бы открыть меню, возьми его в руку и §fиспользуй§7 (зажми на телефоне, ПКМ на пк)\n\n  Помимо него есть еще кастомные §fкоманды§7.\n  Все они вводятся в чат и должны начинаться с '-'.\n  Что бы получить список всех доступных команд пропиши в чат §f-help§7.\n\n\nНажми одну из кнопок внизу, если прочитал гайд.`
		);
		f.button("Выход");
		const ActionFormResponse = await f.show(player);
		if (ActionFormResponse.canceled && ActionFormResponse.cancelationReason !== FormCancelationReason.userBusy)
			return player.tell(
				`А прочитать слабо было? Если все же хочешь прочитать гайд и не задавать вопросы в чате напиши §f-info`
			);
		player.addTag("WSeenLearning");
	}
});
