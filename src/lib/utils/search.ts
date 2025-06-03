/**
 * Compares the similarity between two strings using an n-gram comparison method. The grams default to length 2. Code by
 * {@link https://stackoverflow.com/a/62216738/23560013 MgSam}
 *
 * @param str1 The first string to compare.
 * @param str2 The second string to compare.
 * @param gramSize The size of the grams. Defaults to length 2.
 */
export function stringSimilarity(str1: string, str2: string, gramSize = 2) {
  if (!str1.length || !str2.length) {
    return 0.0
  }

  //Order the strings by length so the order they're passed in doesn't matter
  //and so the smaller string's ngrams are always the ones in the set
  const s1 = str1.length < str2.length ? str1 : str2
  const s2 = str1.length < str2.length ? str2 : str1

  const pairs1 = getNGrams(s1, gramSize)
  const pairs2 = getNGrams(s2, gramSize)
  const set = new Set(pairs1)

  const total = pairs2.length
  let hits = 0
  for (const item of pairs2) {
    if (set.delete(item)) hits++
  }
  return hits / total
}

function getNGrams(s: string, len: number) {
  s = ' '.repeat(len - 1) + s.toLowerCase() + ' '.repeat(len - 1)
  const v = new Array<string>(s.length - len + 1)
  for (let i = 0; i < v.length; i++) {
    v[i] = s.slice(i, i + len)
  }
  return v
}

/**
 * Takes a search string and an array of strings, calculates the similarity between each string in the array and the
 * search string, and returns an array of tuples containing the original string and its similarity score, sorted in
 * descending order of similarity score.
 *
 * @param search - The `search` parameter is a string that represents the search term or keyword that you want to use
 *   for searching within the `array` of strings.
 * @param array - An array of strings that you want to search through.
 */
export function inaccurateSearch(search: string, array: string[]): [string, number][] {
  return array
    .map((element): [string, number] => [element, stringSimilarity(search, element)])
    .sort((a, b) => b[1] - a[1])
}
