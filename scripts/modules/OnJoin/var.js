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
