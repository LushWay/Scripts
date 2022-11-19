import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { wo } from "../../lib/Class/Options.js";
import { setPlayerInterval, XA } from "xapi.js";

/**
 * Выводит строку времени
 * @returns {String}
 */
export function timeNow() {
	const time = new Date(Date()).getHours() + 3;
	if (time < 6) return "§dДоброй ночи";
	if (time < 12) return "§6Доброе утро";
	if (time < 18) return "§gДобрый день";
	return "§3Добрый вечер";
}

/**
 * Выводит время в формате 00:00
 * @returns {String}
 */
export function shortTime() {
	const time = new Date(Date());
	time.setHours(time.getHours() + 3);
	const min = String(time.getMinutes());
	return `${time.getTime()}:${min.length == 2 ? min : "0" + min}`;
}

setPlayerInterval(async (p) => {
	if (XA.Entity.getTagStartsWith(p, "joinedAt:")) {
		const pos = XA.Entity.getTagStartsWith(p, "joinedAt:")
			.split(" ")
			.map((e) => parseInt(e));
		const message =
			wo
				.G("spawn:message")
				?.replace("$name", p.name)
				?.replace("$время", timeNow())
				?.replace("$time", shortTime()) ??
			`${timeNow()}, ${p.name}!\n§9Время • ${shortTime()}`;
		if (
			p.location.x == pos[0] &&
			p.location.y == pos[1] &&
			p.location.z == pos[2]
		) {
			if (p.hasTag("on_ground")) {
				XA.Chat.runCommand("scoreboard objectives add animStage1 dummy");
				const q = XA.Entity.getScore(p, "animStage1");
				let start;
				const co = wo.Q("spawn:animcolor") ?? "§f";
				q <= 5 ? (start = `${co}»  `) : (start = `${co}» `);
				let end;
				q <= 5 ? (end = `  ${co}«`) : (end = ` ${co}«`);
				p.runCommand("title @s times 0 120 0");
				p.runCommand(
					`title @s actionbar ${
						wo.Q("spawn:actionbar") ?? "§eСдвинься что бы продолжить"
					}`
				);
				p.runCommand(
					`title @s title ${start}${wo.Q("spawn:title") ?? "§aServer"}${end}`
				);
				p.runCommand(
					`title @s subtitle ${wo.Q("spawn:subtitle") ?? "Добро пожаловать!"}`
				);
				q == 0
					? p.runCommand("scoreboard players set @s animStage1 10")
					: p.runCommand("scoreboard players add @s animStage1 -2");
			} else {
				XA.Entity.removeTagsStartsWith(p, "joinedAt:");

				XA.Chat.rcs([
					`tellraw @a[tag=!"another:join:disable",name=!"${p.name}"] {"rawtext":[{"translate":"§7${p.name} §8Очнулся в воздухе"}]}`,
					`scoreboard players add "${p.name}" join 1`,
					`playsound break.amethyst_cluster @a[tag=!"joinsound:disable"]`,
				]);
				p.tell(message);
				p.addTag("WSeenJoinMessage");
				p.runCommand("title @s clear");
			}
		} else if (!p.hasTag("WSeenJoinMessage")) {
			XA.Entity.removeTagsStartsWith(p, "joinedAt:");
			XA.Chat.rcs([
				`tellraw @a[tag=!"another:join:disable",name=!"${p.name}"] {"rawtext":[{"translate":"§7${p.name} §8Сдвинулся"}]}`,
				`playsound break.amethyst_cluster @a[tag=!"joinsound:disable"]`,
				`scoreboard players add "${p.name}" join 1`,
			]);
			p.tell(message);
			p.addTag("WSeenJoinMessage");
			p.runCommand("title @s clear");
		}
	}
	if (!p.hasTag("WSeenLearning") && p.hasTag("WSeenJoinMessage")) {
		const f = new ActionFormData();
		f.title("Краткий гайд");
		f.body(
			wo
				.G("joinform:body")
				?.replace("$name", p.name)
				?.replace("$time", timeNow()) ??
				`${timeNow()}, ${
					p.name
				}!\n§7Для навигации по серверу используется §fменю§7 (зачарованный алмаз в инвентаре).\n  Что бы открыть меню, возьми его в руку и §fиспользуй§7 (зажми на телефоне, ПКМ на пк)\n\n  Помимо него есть еще кастомные §fкоманды§7.\n  Все они вводятся в чат и должны начинаться с '-'.\n  Что бы получить список всех доступных команд пропиши в чат §f-help§7.\n\n\nНажми одну из кнопок внизу, если прочитал гайд.`
		);
		f.button("Выход");
		const ActionFormResponse = await f.show(p);
		if (
			ActionFormResponse.canceled &&
			ActionFormResponse.cancelationReason !== FormCancelationReason.userBusy
		)
			return p.tell(
				`А прочитать слабо было? Если все же хочешь прочитать гайд и не задавать вопросы в чате напиши §f-info`
			);
		p.addTag("WSeenLearning");
	}
});
