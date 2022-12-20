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

export const CONFIG_JOIN = {
	/** Array with strings to show on join. They will change every second. You can use $<value> with any string value in this.animation_vars  */
	animation: {
		stages: ["» $title «", "»  $title  «"],
		vars: {
			title: "§b§lBuild§r§f",
		},
	},
	// actionBar: "§3Сдвинься что бы продолжить", // Optional
	subtitle: "Добро пожаловать!", // Optional
	onJoin: {
		air: "§8Очнулся в воздухе",
		ground: "§8Сдвинулся",
		sound: "break.amethyst_cluster",
	},
};
