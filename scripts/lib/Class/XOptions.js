import { Player, world } from "@minecraft/server";
import { XInstantDatabase } from "../Database/DynamicProperties.js";
import { ScoreboardDB } from "../Database/Scoreboard.js";
import { DIMENSIONS } from "../List/dimensions.js";

/** @type {Array<{name: string; desc: string; lvl: number; exp: boolean; Aitem: string;}>} */
export let OPTIONS = [];

const lightDB = new ScoreboardDB("worldSettings");

export class PlayerOption {
	/**
	 * Register an option
	 * @param {string} name Имя опции
	 * @param {string} desc Описание
	 * @param {number} [permissionLvL] Уровень разрешений
	 * @param {string} [ActiveItem]
	 * @param {boolean} [isExpiremental]
	 * @example new option('JS:enable', 'Ниче не делает', 10)
	 */
	constructor(name, desc = null, permissionLvL = 0, isExpiremental = false, ActiveItem) {
		if (!po.E(name)) {
			let description = desc;
			if (isExpiremental) description = desc + "§r§e\n\n▲ Экспериментальная настройка ▲";
			const a = {
				name: name,
				desc: description,
				lvl: permissionLvL,
				exp: isExpiremental,
				Aitem: ActiveItem,
			};
			OPTIONS.push(a);
			OPTIONS = OPTIONS.sort((a, b) => (a.name > b.name ? 1 : -1));
		}
	}
}
export const po = {
	/**
	 * Возвращает опцию
	 * @param {string} option
	 * @return {Object}
	 * @example OptionQ('JS:enable'): name: 'JS.enable', desc: '', lvl: 3
	 */
	E(option) {
		return OPTIONS.find((Element) => {
			if (Element.name == option) return Element;
		});
	},
	/**
	 * Вызывает опцию на игроке
	 * @param {string} option
	 * @param {Player} player Игрок для запроса
	 * @return {boolean}
	 * @example OptionQ('JS:enable', player)
	 */
	Q(option, player) {
		const e = this.E(option);
		if (e && player.hasTag(e.name)) return true;
		return false;
	},
	/**
	 * Вызывает опцию на игроке
	 * @param {string} option
	 * @param {Player} player Игрок для запроса
	 * @return {"no" | ["removed" | "added", Object]}
	 * @example OptionQ('JS:enable', player)
	 */
	change(option, player) {
		const e = this.E(option);
		if (!e) return "no";
		if (player.hasTag(e.name)) {
			player.removeTag(e.name);
			return ["removed", e];
		} else {
			player.addTag(e.name);
			return ["added", e];
		}
	},
	/**
	 * Очищает настройки игрока
	 * @param {Player} player Игрок для запроса
	 */
	clear(player) {
		OPTIONS.forEach((e) => {
			if (player.hasTag(e.name)) player.removeTag(e.name);
		});
	},
	/**
	 * Возвращает список всех элементов и их описание у игрока
	 * @param {{ hasTag: (arg0: string) => any; }} player
	 */
	list(player) {
		let el = [];
		OPTIONS.forEach((e) => {
			if (player.hasTag(e.name) && e.lvl < 20) el.push(e);
		});
		return el;
	},
};

/**
 * @type {Array<{name: string; desc: string, lvl: number; text: boolean}>}
 */
export let WORLDOPTIONS = [];

export const db = new XInstantDatabase(world, "options");

export class WorldOption {
	/**
	 * Register an option
	 * @param {string} name Имя опции
	 * @param {string} desc Описание
	 * @param {number} permissionLvL Уровень разрешений
	 * @example new option('LOL:enable', 'Описулька', true)
	 */
	constructor(name, desc = null, IsTextOption = false, permissionLvL = 0) {
		if (!wo.E(name)) {
			let lvl = 0;
			let description = desc;
			if (IsTextOption) {
				lvl = 20;
				description = desc + "§r§f\n \nТекстовая опция";
			} else {
				lvl = permissionLvL;
			}
			WORLDOPTIONS.push({
				name: name,
				desc: description,
				lvl: lvl,
				text: IsTextOption,
			});
			WORLDOPTIONS = WORLDOPTIONS.sort((a, b) => (a.name > b.name ? 1 : -1));
		}
	}
}
export const wo = {
	/**
	 * Возвращает опцию
	 * @param {string} option
	 * @return {Object}
	 * @example E('JS:enable'): name: 'JS.enable', description: '', lvl: 3
	 */
	E(option) {
		return WORLDOPTIONS.find((e) => e.name == option);
	},
	/**
	 * Вызывает опцию
	 * @param {string} option
	 * @param {boolean} returnfalse
	 * @return {boolean}
	 * @example Q('enable')
	 */
	Q(option, returnfalse = true) {
		const e = this.E(option);
		if (e && !e.text) {
			if (e.lvl < 10 && lightDB.get(option) != 0) return true;
			if (db.get(option)) return true;
		}
		if (returnfalse) return false;
	},
	/**
	 * Вызывает опцию
	 * @param {string} option
	 * @return {string}
	 * @example G('values')
	 */
	G(option) {
		const e = this.E(option);
		if (e && e.text) {
			const e = db.get(option);
			return typeof e === "string" ? e : "";
		}
	},
	/**
	 * Вызывает опцию
	 * @param {string} option
	 * @param {boolean} [returnfalse]
	 * @param {boolean} [IsTextOption]
	 * @return {boolean | string | number}
	 * @example QQ('JS:enable')
	 */
	QQ(option, returnfalse = true, IsTextOption) {
		if (IsTextOption) return db.get(option);
		if (lightDB.get(option) != 0) return true;
		if (db.get(option)) return true;
		if (returnfalse) return false;
	},
	/**
	 * Вызывает опцию на игроке
	 * @param {string} option
	 * @return {["no" | "added" | "removed", object?]}
	 * @example change('JS:enable')
	 */
	change(option) {
		const e = this.E(option);
		if (!e) return ["no"];
		if (e.text) throw new Error("Isn't text option: " + option);
		if (e.lvl < 10) {
			if (e && lightDB.get(option) != 0) {
				lightDB.set(option, 0);
				return ["removed", e];
			} else {
				lightDB.set(option, 1);
				return ["added", e];
			}
		} else {
			if (e && db.get(option)) {
				db.set(option, 0);
				return ["removed", e];
			} else {
				db.set(option, 1);
				return ["added", e];
			}
		}
	},
	/**
	 * Устанавливает текстовую настройку
	 * @param {string} option
	 * @param {string | boolean | number} value
	 * @returns
	 */
	set(option, value) {
		const e = this.E(option);
		if (!e.text) throw new Error("Isn't text option: " + option);
		db.set(option, value);
	},
	reset: lightDB.reset,
	reset0() {
		for (let opt of WORLDOPTIONS) {
			console.warn(opt.name);
			if (opt.lvl <= 10 && !wo.Q(opt.name)) {
				console.warn(opt.name);
					DIMENSIONS.overworld.runCommandAsync(`scoreboard players reset "${opt.name}" ${this.name}`);
			}
		}
	},
};
