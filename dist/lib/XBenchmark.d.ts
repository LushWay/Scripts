/**
 * It returns a function that when called, returns the time it took to call the function and records result to const
 * @param {string} label - The name of the benchmark.
 * @returns {() => number} A function that returns the time it took to run the function.
 */
export function benchmark(label: string, type?: string): () => number;
/** @type {Record<string, Record<string, number[]>>} */
export const BECHMARK_RESULTS: Record<string, Record<string, number[]>>;
