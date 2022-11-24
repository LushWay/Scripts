/**
 * Выводит строку времени
 * @returns {string}
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
 * @returns {string}
 */
export function shortTime() {
	const time = new Date(Date());
	time.setHours(time.getHours() + 3);
	const min = String(time.getMinutes());
	return `${time.getTime()}:${min.length == 2 ? min : "0" + min}`;
}

export const CONFIG_JOIN = {
	message: (player) => `${timeNow()}, ${player.name}!\n§9Время • ${shortTime()}`,
	animaton: {
		color: "§f",
	},
	actionBar: "§eСдвинься что бы продолжить",
	title: "§aServer",
	subtitle: "Добро пожаловать!",
};
