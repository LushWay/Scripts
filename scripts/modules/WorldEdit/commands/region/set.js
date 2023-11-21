import { BlockTypes, Player } from '@minecraft/server'
import { inaccurateSearch } from 'lib/Class/Search.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { WorldEdit } from '../../class/WorldEdit.js'
import { Cuboid } from '../../utils/cuboid.js'

const set = new Command({
  name: 'set',
  description: 'Частично или полностью заполняет блоки в выделенной области',
  role: 'moderator',
})

set
  .string('block')
  .int('data', true)
  .array('mode', ['destroy', 'hollow', 'keep', 'outline', 'replace'], true)
  .string('other', true)
  .int('otherData', true)
  .executes((ctx, block, blockData, mode, other, otherData) => {
    const we = WorldEdit.forPlayer(ctx.sender)
    if (!we.selectionCuboid) return ctx.reply('§cЗона не выделена!')

    if (!blockIsAvaible(block, ctx.sender)) return
    if (other && !blockIsAvaible(other, ctx.sender)) return

    const time = timeCaculation(we.pos1, we.pos2)
    if (time >= 0.01)
      ctx.reply(
        `§9► §rНачато заполнение, которое будет закончено приблизительно через ${time} сек`
      )

    we.fillBetween(block, blockData, mode, other, otherData).then(result =>
      ctx.reply(result)
    )
  })

set.executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.sender)
  if (!we.selectionCuboid) return ctx.reply('§cЗона не выделена!')
  ctx.reply('§b> §3Закрой чат!')
  new ModalForm('Заполнить')
    .addTextField('Блок', 'e.g. stone', '')
    .addSlider('Дата блока', 0, 15, 1, 0)
    .addDropdown('Режим замены', [
      'Отключено',
      'replace',
      'destroy',
      'hollow',
      'keep',
      'outline',
    ])
    .addTextField(
      'Заменяемый блок (только для режима replace!)',
      'например, stone',
      ''
    )
    .addSlider('Дата заменяемого блока', 0, 15, 1, 0)
    .show(ctx.sender, (_, block, blockData, mode, other, otherData) => {
      if (!blockIsAvaible(block, ctx.sender)) return
      if (other && !blockIsAvaible(other, ctx.sender)) return

      const time = timeCaculation(we.pos1, we.pos2)
      if (time >= 0.01)
        ctx.reply(
          `§9► §rНачато заполнение, которое будет закончено приблизительно через ${time} сек`
        )

      we.fillBetween(
        block,
        blockData,
        mode === 'Отключено' ? '' : mode,
        other,
        otherData
      ).then(result => ctx.reply(result))
    })
})

/**
 * Caculates average time it will take to complete fill
 * @param {{x: number; y: number, z: number}} pos1
 * @param {{x: number; y: number, z: number}} pos2
 * @returns {number}
 */
function timeCaculation(pos1, pos2) {
  const cube = new Cuboid(pos1, pos2)
  const timeForEachFill = 3
  const fillSize = 32768
  return Math.round((cube.blocksBetween / fillSize) * timeForEachFill * 0.05)
}

const prefix = 'minecraft:'

const blocks = BlockTypes.getAll().map(e => e.id.substring(prefix.length))
/**
 *
 * @param {string} block
 * @param {Player} player
 * @returns {boolean}
 */
function blockIsAvaible(block, player) {
  if (blocks.includes(block)) return true

  player.tell('§cБлока §f' + block + '§c не существует.')

  let search = inaccurateSearch(block, blocks)

  const options = {
    minMatchTriggerValue: 0.5,
    maxDifferenceBeetwenSuggestions: 0.15,
    maxSuggestionsCount: 3,
  }

  if (!search[0] || (search[0] && search[0][1] < options.minMatchTriggerValue))
    return false

  const suggest = (/**@type {[string, number]}*/ a) =>
    `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%%)§c`

  let suggestion = '§cВы имели ввиду ' + suggest(search[0])
  const firstValue = search[0][1]
  search = search
    .filter(e => firstValue - e[1] <= options.maxDifferenceBeetwenSuggestions)
    .slice(1, options.maxSuggestionsCount)

  for (const [i, e] of search.entries())
    suggestion += `${i + 1 === search.length ? ' или ' : ', '}${suggest(e)}`

  player.tell(suggestion + '§c?')
  return false
}
