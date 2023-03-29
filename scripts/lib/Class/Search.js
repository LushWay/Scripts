/**
 * @author {Zdyn}
 * @link https://github.com/zdyn/jaro-winkler-js/blob/master/jaro-winkler-js.min.js
 */

/**
 * @param {string} string1
 * @param {string} string2
 */
export function stringDistance(string1, string2) {
	if (string1.length > string2.length) [string1, string2] = [string2, string1];

	const matchWindow = ~~Math.max(0, string2.length / 2 - 1);

	/** @type {string[]} */
	let str1Matches = [];
	/** @type {string[]} */
	let str2Matches = [];

	forEveryChar(string1, (i, char) => {
		const start = Math.max(0, i - matchWindow);
		const end = Math.min(i + matchWindow + 1, string2.length);

		const windowStart = Math.min(start, end);
		const windowEnd = Math.max(start, end);

		for (let l = windowStart; l < windowEnd; ++l)
			if (!str2Matches[l] && char === string2[l]) {
				str1Matches[i] = char;
				str2Matches[l] = string2[l];
				break;
			}
	});
	//@ts-ignore
	str1Matches = str1Matches.join("");
	//@ts-ignore
	str2Matches = str2Matches.join("");

	const matchesN = str1Matches.length;
	if (!matchesN) {
		return 0;
	}
	// Count transpositions
	let transpositions = 0;
	forEveryChar(str1Matches, (i, char) => {
		if (char !== str2Matches[i]) transpositions++;
	});

	// Count prefix matches
	let prefix = 0;
	forEveryChar(string1, (i, char) => {
		if (char !== string2[i]) prefix++;
	});

	const jaro =
		(matchesN / string1.length +
			matchesN / string2.length +
			(matchesN - ~~(transpositions / 2)) / matchesN) /
		3.0;
	return jaro + Math.min(prefix, 4) * 0.1 * (1 - jaro);
}

/**
 *
 * @param {*} string
 * @param {function(number, string): void} callback
 */
function forEveryChar(string, callback) {
	for (const [i, char] of string.split("").entries()) callback(i, char);
}

/**
 * It takes a string and an array of strings, and returns an array of arrays, where each sub-array
 * contains a string from the array and the Levenshtein distance between that string and the search
 * string
 * @param {string} search - The string you're searching for
 * @param {string[]} array - an array of strings
 * @returns {[string, number][]} An array of arrays. Each sub-array contains the element and the distance.
 */
export function inaccurateSearch(search, array) {
	return array
		.map(
			/** @type {(v: string,) => [string, number]} */ (element) => [
				element,
				stringDistance(search, element),
			]
		)
		.sort((a, b) => b[1] - a[1]);
}

