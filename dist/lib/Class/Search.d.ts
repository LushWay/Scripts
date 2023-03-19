/**
 * @author {Zdyn}
 * @link https://github.com/zdyn/jaro-winkler-js/blob/master/jaro-winkler-js.min.js
 */
/**
 * @param {string} string1
 * @param {string} string2
 */
export function stringDistance(string1: string, string2: string): number;
/**
 * It takes a string and an array of strings, and returns an array of arrays, where each sub-array
 * contains a string from the array and the Levenshtein distance between that string and the search
 * string
 * @param {string} search - The string you're searching for
 * @param {string[]} arr - an array of strings
 * @returns {[string, number][]} An array of arrays. Each sub-array contains the element and the distance.
 */
export function inaccurateSearch(search: string, arr: string[]): [string, number][];
