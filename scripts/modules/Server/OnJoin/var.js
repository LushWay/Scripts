import { Player } from "@minecraft/server";
import { EventSignal } from "lib/Class/Events.js";

/**
 * Выводит строку времени
 * @returns {string}
 */
export function timeNow() {
	const time = new Date(Date()).getHours() + 3;
	if (time < 6) return "§9Доброй ночи";
	if (time < 12) return "§6Доброе утро";
	if (time < 18) return "§bДобрый день";
	return "§3Добрый вечер";
}

/**
 * Выводит время в формате 00:00
 * @returns {string}
 */
export function shortTime() {
	const time = new Date(Date());
	time.setHours(time.getHours() + 3);
	const min = String(time.getMinutes());
	return `${time.getHours()}:${min.length == 2 ? min : "0" + min}`;
}

/**
 * @typedef {"join" | "firstTime" | "playerClosedGuide"} JoinEvents
 */

export const JOIN = {
	CONFIG: {
		/** Array with strings to show on join. They will change every second. You can use $<var name> from animation.vars  */
		title_animation: {
			stages: ["» $title «", "»  $title  «"],
			/** @type {Record<string, string>} */
			vars: {
				title: "§6§lDevelopment§r§f",
			},
		},
		actionBar: "", // Optional
		subtitle: "Разработка!", // Optional
		messages: {
			air: "§8Очнулся в воздухе",
			ground: "§8Сдвинулся",
			sound: "break.amethyst_cluster",
		},
	},
	/**
	 * @type {Partial<Record<JoinEvents, any>>}
	 */
	EVENT_DEFAULTS: {},
	/**
	 * @type {Record<JoinEvents, EventSignal<Player>>}
	 */
	EVENTS: {
		join: new EventSignal(),
		firstTime: new EventSignal(),
		playerClosedGuide: new EventSignal(),
	},
};
