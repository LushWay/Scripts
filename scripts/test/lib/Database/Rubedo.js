import 'lib/Extensions/import.js'

import { system, world } from '@minecraft/server'
import { DPDBProxy } from 'lib/Database/Properties.js'
import { Database } from 'lib/Database/Rubedo.js'
import { util } from 'lib/util.js'

const type = 'performance'

world.afterEvents.worldInitialize.subscribe(() => {
  world.overworld.runCommandAsync(
    'tickingarea add 0 -64 0 0 200 0 database true'
  )
})

async function test(gi = 0) {
  const loadEnd = util.benchmark(
    Database.isTablesInited ? 'restore' : 'load',
    type
  )
  /**
   * @type {Record<string, undefined | JSONLike>}
   */
  const db = DPDBProxy('test', {
    defaultValue(key) {
      return { defaulValueKey: key }
    },
  })

  loadEnd()

  console.log('loaded number ' + gi)

  for (let i = 0; i < (gi === 0 ? 10 : 10); i++) {
    const end = util.benchmark('work', type)
    ;(db[i] ??= {}).value = { settedValue: i }
    end()
    await null
    if (i % 100 === 0) console.log('num', i)
  }

  if (gi === 0) {
    db.array = [1, 2, 3]
    db.array.push(4)

    console.log(db.array)

    system.runTimeout(
      () => {
        const prop = world.getDynamicProperty('test')
        if (typeof prop === 'string')
          console.log('Array: ', JSON.parse(prop).array)
      },
      'teaada',
      20
    )
  }

  console.log('done.')
}

world.afterEvents.worldInitialize.subscribe(data => {
  const totalEnd = util.benchmark('totalTime', type)
  ;(async function () {
    for (let i = 0; i < 1; i++) {
      await test(i)
    }
  })()
    .then(totalEnd)
    .then(stringifyBenchmarkResult)
    .then(console.log)
    .catch(util.error)
})

function stringifyBenchmarkResult() {
  let output = ''
  let res = []
  for (const [key, val] of Object.entries(util.benchmark.results[type])) {
    const totalCount = val.length
    const totalTime = val.reduce((p, c) => p + c)
    const average = totalTime / totalCount

    res.push({ key, totalCount, totalTime, average })
  }

  res = res.sort((a, b) => a.average - b.average)

  for (const { key, totalCount, totalTime, average } of res) {
    const color = colors.find(e => e[0] > average)?.[1] ?? '§4'

    output += `§3Label §f${key}§r\n`
    output += `§3| §7average: ${color}${average.toFixed(2)}ms\n`
    output += `§3| §7total time: §f${totalTime}ms\n`
    output += `§3| §7call count: §f${totalCount}\n`
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
