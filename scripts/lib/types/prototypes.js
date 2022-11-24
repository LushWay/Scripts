//author: https://github.com/zdyn/jaro-winkler-js/blob/master/jaro-winkler-js.min.js
function distance(string1, string2) {
	if (string1.length > string2.length) [string1, string2] = [string2, string1];

	const matchWindow = ~~Math.max(0, string2.length / 2 - 1);

	let str1Matches = [];
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
		(matchesN / string1.length + matchesN / string2.length + (matchesN - ~~(transpositions / 2)) / matchesN) / 3.0;
	return jaro + Math.min(prefix, 4) * 0.1 * (1 - jaro);
}

//xapi original method
Array.prototype.inaccurateSearch = function (e) {
	let res = {};
	for (const el of this) {
		res[el] = distance(e, el);
	}
	return Object.entries(res).sort((a, b) => b[1] - a[1]);
};

// @ts-expect-error
String.prototype.cc = () => this.replace(/§./g, "");

/**
 *
 * @param {*} string
 * @param {function(number, string): void} callback
 */
function forEveryChar(string, callback) {
	for (const [i, char] of string.split("").entries()) callback(i, char);
}
