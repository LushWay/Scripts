/**
 * It takes the benchmark results and sorts them by average time, then it prints them out in a nice format
 *
 * @returns A string.
 */

import { TIMERS_PATHES } from 'lib/extensions/system'
import { util } from 'lib/util'

export function stringifyBenchmarkResult({ type = 'test', timerPathes = false } = {}) {
  let output = ''

  // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  let res = Object.entries(util.benchmark.results[type])

  // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
  res = res.sort((a, b) => a[1] - b[1])

  for (const [key, average] of res) {
    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    const color = colors.find(e => e[0] > average)?.[1] ?? '§4'
    const isPath = timerPathes && key in TIMERS_PATHES

    output += `§3Label §f${key}§r\n`

    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    output += `§3| §7average: ${color}${average.toFixed(2)}ms\n`
    // output += `§3| §7total time: §f${totalTime}ms\n`
    // output += `§3| §7call count: §f${totalCount}\n`
    if (isPath) output += `§3| §7path: §f${getPath(key)}\n`
    output += '\n\n'
  }
  return output
}
/** @type {[number, string][]} */
const colors = [
  [0.1, '§a'],
  [0.3, '§2'],
  [0.5, '§g'],
  [0.65, '§6'],
  [0.8, '§c'],
]
/** @param {string} key */

export function getPath(key) {
  // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  return `\n${TIMERS_PATHES[key]}`.replace(/\n/g, '\n§3| §r')
}
