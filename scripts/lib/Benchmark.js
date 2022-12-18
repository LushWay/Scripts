/** @type {Record<string, number[]>} */
export const BECHMARK_RESULTS = {};

/**
 * It returns a function that when called, returns the time it took to call the function and records result to const
 * @param {string} label - The name of the benchmark.
 * @returns {() => number} A function that returns the time it took to run the function.
 */
export function benchmark(label) {
	const start_time = Date.now();
	return function end() {
		const took_time = Date.now() - start_time;
		(BECHMARK_RESULTS[label] || (BECHMARK_RESULTS[label] = [])).push(took_time);
		return took_time;
	};
}

/**
 * It takes the benchmark results and sorts them by average time, then it prints them out in a nice
 * format
 * @returns A string.
 */
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
		const style = [
			[0.1, "§a"],
			[0.3, "§2"],
			[0.5, "§g"],
			[0.65, "§6"],
			[0.8, "§c"],
		];

		const cur_style = style.find((e) => e[0] > average)?.[1] ?? "§4";

		output += `§3Label §f${key}§r\n`;
		output += `§3| §7average: ${cur_style}${average.toFixed(2)}ms\n`;
		output += `§3| §7total time: §f${total_time}ms\n`;
		output += `§3| §7call count: §f${total_count}\n`;
		output += "\n\n";
	}
	return output;
}
