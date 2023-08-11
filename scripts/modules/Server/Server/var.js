import { ScoreboardDB } from "lib/Database/Scoreboard.js";
import { Options, util } from "xapi.js";

/**
 * @type {Array<"unknown" | "build" | "survival" | "disabled">}
 */
const TYPES = ["unknown", "build", "survival", "disabled"];
const options = Options.world("server", {
	lockNether: {
		desc: "Выключает незер",
		value: true,
		name: "Блокировка незера",
	},
	timer: {
		value: true,
		desc: "Какой-та таймер, я сам хз че это",
		name: "Таймер",
	},
	type: {
		name: "Тип сервера",
		value: 0,
		desc: `Доступные значения: \n§f${util
			.inspect(Object.fromEntries(Object.entries(TYPES)))
			.replace("{", "")
			.replace("}", "")}`,
		requires: true,
	},
});

const TYPE = TYPES[getType()];

export const SERVER = {
	money: db("money", "Монеты"),
	leafs: db("leafs", "Листы"),
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

		console[XA.state.firstLoad ? "warn" : "log"](text);
	}

	return num;
}
