import { BlockTypes } from '@minecraft/server'
import { inaccurateSearch } from 'lib'
import { t } from 'lib/text'

const prefix = 'minecraft:'
const blocks = BlockTypes.getAll().map(e => e.id.substring(prefix.length))
export function blockIsAvaible(block: string, player: { fail(s: string): void }): boolean {
  if (blocks.includes(block)) return true

  player.fail(t.error`Блока ${block} не существует.`)

  let search = inaccurateSearch(block, blocks)

  const options = {
    minMatchTriggerValue: 0.5,
    maxDifferenceBeetwenSuggestions: 0.15,
    maxSuggestionsCount: 3,
  }

  if (!search[0] || (search[0] && search[0][1] < options.minMatchTriggerValue)) return false

  const suggest = (a: [string, number]) => `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%%)§c`

  let suggestion = t.error`Вы имели ввиду ${suggest(search[0])}`
  const firstValue = search[0][1]
  search = search
    .filter(e => firstValue - e[1] <= options.maxDifferenceBeetwenSuggestions)
    .slice(1, options.maxSuggestionsCount)

  // TODO lang.join
  for (const [i, e] of search.entries()) suggestion += `${i + 1 === search.length ? ' или ' : ', '}${suggest(e)}`

  player.fail(t.error`${suggestion}?`)
  return false
}
