import { world } from "@minecraft/server";

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
		(BECHMARK_RESULTS[label] || (BECHMARK_RESULTS[label] = [])).push(took_time);
		return took_time;
	};
}

export function visualise_benchmark_result() {
	let output = "";
	let res = [];
	for (const [key, val] of Object.entries(BECHMARK_RESULTS)) {
		const total_count = val.length;
		const total_time = val.reduce((p, c) => p + c);
		const average = total_time / total_count;

		res.push({ key, total_count, total_time, average });
	}

	res = res.sort((a, b) => a.average - b.average);

	for (const { key, total_count, total_time, average } of res) {
		/** @type {[number, string][]} */
		const a = [
			[0.1, "§a"],
			[0.3, "§2"],
			[0.5, "§g"],
			[0.65, "§6"],
			[0.8, "§c"],
			[1000, "§4"],
		];

		const p = a.find((e) => e[0] > average)[1];

		output += `§3Label §f${key}§r\n`;
		output += `§3| §7average: ${p}${average.toFixed(2)}ms\n`;
		output += `§3| §7total time: §f${total_time}ms\n`;
		output += `§3| §7call count: §f${total_count}\n`;
		output += "\n\n";
	}
	return output;
}
