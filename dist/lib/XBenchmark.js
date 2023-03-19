/** @type {Record<string, Record<string, number[]>>} */
export const BECHMARK_RESULTS = {};
/**
 * It returns a function that when called, returns the time it took to call the function and records result to const
 * @param {string} label - The name of the benchmark.
 * @returns {() => number} A function that returns the time it took to run the function.
 */
export function benchmark(label, type = "test") {
    const start_time = Date.now();
    return function end() {
        var _a;
        const took_time = Date.now() - start_time;
        BECHMARK_RESULTS[type] ?? (BECHMARK_RESULTS[type] = {});
        (_a = BECHMARK_RESULTS[type])[label] ?? (_a[label] = []);
        BECHMARK_RESULTS[type][label].push(took_time);
        return took_time;
    };
}
