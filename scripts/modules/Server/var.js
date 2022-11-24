import { ScoreboardDB } from "../../lib/Database/Scoreboard.js";

export const global = { Radius: 200 };
export const time = {
	anarchy: timer("anarchy", "на анархии"),
	all: timer("all", "всего"),
	day: timer("day", "за день"),
};

export const stats = {
	Bplace: db("blockPlace", "Поставлено блок"),
	Bbreak: db("blockBreak", "Сломано блоков"),
	FVlaunc: db("FVlaunc", "Фв запущено"),
	FVboom: db("FVboom", "Фв взорвано"),
	Hget: db("Hget", "Урона получено"),
	Hgive: db("Hgive", "Урона нанесено"),
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
