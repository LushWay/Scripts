/** @type {Record<string, number[]>} */
export const BECHMARK_RESULTS = {};

/**
 *
 * @param {string} label
 * @returns {() => number}
 */
export function benchmark(label) {
	const start_time = Date.now();
	return function end() {
		const took_time = Date.now() - start_time;
		if (!(label in BECHMARK_RESULTS)) BECHMARK_RESULTS[label] = [];
		// const timeMark = new Date(Date.now()); `${timeMark.getMinutes()}m ${timeMark.getSeconds()}s ${timeMark.getMilliseconds()}ms`
		BECHMARK_RESULTS[label].push(took_time);
		return took_time;
	};
}

export function visualise_benchmark_result() {
	let output = "";
	let res = [];
	for (const key in BECHMARK_RESULTS) {
		let total_time = 0;
		let total_count = 0;

		for (const e of BECHMARK_RESULTS[key]) {
			total_count++;
			total_time += e;
		}

		const average = total_time / total_count;
		res.push({ key, total_count, total_time, average });
	}

	res = res.sort((a, b) => b.average - a.average);

	for (const { key, total_count, total_time, average } of res) {
		output += `§3Label §f${key}§r\n`;
		output += `§3| §7average: §6${average.toFixed(2)}ms\n`;
		output += `§3| §7total: §f${total_time}ms\n`;
		output += `§3| §7count: §f${total_count}\n`;
		output += "\n\n";
	}
	return output;
}
