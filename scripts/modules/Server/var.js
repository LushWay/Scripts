import { world } from "@minecraft/server";
import { ScoreboardDB } from "../../lib/Database/Scoreboard.js";
import { toStr } from "../../lib/Setup/utils.js";

/**
 * @type {Array<"unknown" | "build" | "survival" | "disabled">}
 */
const TYPES = ["unknown", "build", "survival", "disabled"];
const options = XA.WorldOptions("server", {
	lockNether: { desc: "Выключает незер", value: true },
	timer: { value: true, desc: "Какой-та таймер, я сам хз че это" },
	type: {
		value: 0,
		desc: `Тип сервера. Доступные значения: \n§f${toStr(
			Object.fromEntries(Object.entries(TYPES))
		)
			.replace("{", "")
			.replace("}", "")}`,
	},
});

const TYPE = TYPES[getType()];

export const SERVER = {
	radius: 200,
	stats: {
		blocksPlaced: db("blockPlace", "Поставлено блок"),
		blocksBreaked: db("blockBreak", "Сломано блоков"),
		fireworksLaunched: db("FVlaunch", "Фв запущено"),
		fireworksExpoded: db("FVboom", "Фв взорвано"),
		damageRecieve: db("Hget", "Урона получено"),
		damageGive: db("Hgive", "Урона нанесено"),
		kills: db("kills", "Убийств"),
		deaths: db("deaths", "Смертей"),
	},
	options,
	time: {
		anarchy: timer("anarchy", "на анархии"),
		all: timer("all", "всего"),
		day: timer("day", "за день"),
	},
	type: TYPE,
};

/**
 *
 * @param {string} name
 * @param {string} displayName
 */
function timer(name, displayName) {
	return {
		hours: db(name + "_hours", "Часов " + displayName),
		minutes: db(name + "_mins", "Минут " + displayName),
		seconds: db(name + "_secs", "Секунд " + displayName),
	};
}

/**
 *
 * @param {string} id
 * @param {string} name
 * @returns
 */
function db(id, name) {
	return new ScoreboardDB(id, name);
}

function getType() {
	let num = options.type;

	if (!(num in TYPES) || num === 0) {
		options.type = 0;
		num = 0;
		const text = `§cДля полноценной работы сервера установите значение §ftype§c в настройках §fserver§c и перезагрузите скрипты. `;

		world.say(text);
		console[XA.state.first_load ? "warn" : "log"](text);
	}

	return num;
}
