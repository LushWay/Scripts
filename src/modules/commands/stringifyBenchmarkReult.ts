import { TIMERS_PATHES } from 'lib/extensions/system'
import { util } from 'lib/util'

/**
 * It takes the benchmark results and sorts them by average time, then it prints them out in a nice format
 *
 * @returns A string.
 */
export function stringifyBenchmarkResult({ type = 'test', timerPathes = false, sort = true } = {}) {
  const results = util.benchmark.results[type]
  if (!results) return `No results for type ${type}`

  let output = ''
  let res = Object.entries(results)

  if (sort) res = res.sort((a, b) => a[1] - b[1])

  const max = Math.max(...res.map(e => e[1]))

  for (const [key, average] of res) {
    const color = colors.find(e => e[0] > average)?.[1] ?? '§4'
    const isPath = timerPathes && key in TIMERS_PATHES

    output += `§3Label §f${key}§r\n`
    output += `§3| §7average: ${color}${formatDecimal(average)}ms\n`
    // output += `§3| §7total time: §f${totalTime}ms\n`
    // output += `§3| §7call count: §f${totalCount}\n`
    const percent = average / max
    if (percent !== 1) output += `§3| §7faster: §f${~~(100 - percent * 100)}%%\n`
    if (isPath) output += `§3| §7path: §f${getPath(key)}\n`
    output += '\n\n'
  }
  return output
}

function formatDecimal(num: number): string {
  if (num === 0) return '0'

  if (num > 0.01) return num.toFixed(2)

  const str = num.toFixed(20) // Ensure we have enough decimal places
  const match = /^0\.0*[1-9]{0,3}/.exec(str)

  return match?.[0] ?? str
}

const colors: [number, string][] = [
  [0.1, '§a'],
  [0.3, '§2'],
  [0.5, '§g'],
  [0.65, '§6'],
  [0.8, '§c'],
]

export function getPath(key: string) {
  return `\n${TIMERS_PATHES[key]}`.replace(/\n/g, '\n§3| §r')
}
