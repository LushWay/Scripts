/**
 * Compares the similarity between two strings using an n-gram comparison method. The grams default to length 2. Code by
 * {@link https://stackoverflow.com/a/62216738/23560013 MgSam}
 *
 * @param str1 The first string to compare.
 * @param str2 The second string to compare.
 * @param gramSize The size of the grams. Defaults to length 2.
 */
export function stringSimilarity(str1: string, str2: string, gramSize: number = 2) {
  /**
   * @param {string} s
   * @param {number} len
   */
  function getNGrams(s: string, len: number) {
    s = ' '.repeat(len - 1) + s.toLowerCase() + ' '.repeat(len - 1)
    const v = new Array(s.length - len + 1)
    for (let i = 0; i < v.length; i++) {
      v[i] = s.slice(i, i + len)
    }
    return v
  }

  if (!str1?.length || !str2?.length) {
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
    if (set.delete(item)) {
      hits++
    }
  }

  return hits / total
}

/**
 * It takes a string and an array of strings, and returns an array of arrays, where each sub-array contains a string
 * from the array and the Levenshtein distance between that string and the search string
 *
 * @param search - The string you're searching for
 * @param array - An array of strings
 * @returns An array of arrays. Each sub-array contains the element and the distance.
 */
export function inaccurateSearch(search: string, array: string[]): [string, number][] {
  return array
    .map(
      /** @type {(v: string) => [string, number]} */ (element): [string, number] => [
        element,
        stringSimilarity(search, element),
      ],
    )
    .sort((a, b) => b[1] - a[1])
}
