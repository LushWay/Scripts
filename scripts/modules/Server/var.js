import { ScoreboardDB } from "../../lib/Database/Scoreboard.js";
import { XA } from "../../xapi.js";

export const global = { Radius: 200 };

export const options = XA.WorldOptions("server", {
	spawn: {
		desc: "Включает команду /hub, пункт в меню и приветствие.\n\n(требуется перезагрузка)",
		value: false,
	},
	lockNether: { desc: "Выключает незер", value: true },
	bowhit: { desc: "Звук попадания по энтити из лука", value: true },
	timer: { value: true, desc: "" },
	zoneCenter: { value: "0 0", desc: "" },
});

export const time = {
	anarchy: timer("anarchy", "на анархии"),
	all: timer("all", "всего"),
	day: timer("day", "за день"),
};

export const stats = {
	blocksPlaced: db("blockPlace", "Поставлено блок"),
	blocksBreaked: db("blockBreak", "Сломано блоков"),
	fireworksLaunched: db("FVlaunch", "Фв запущено"),
	fireworksExpoded: db("FVboom", "Фв взорвано"),
	damageRecieve: db("Hget", "Урона получено"),
	damageGive: db("Hgive", "Урона нанесено"),
	kills: db("kills", "Убийств"),
	deaths: db("deaths", "Смертей"),
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

