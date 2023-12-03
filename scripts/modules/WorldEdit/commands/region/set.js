import { BlockPermutation, BlockTypes, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { inaccurateSearch } from 'lib/Class/Search.js'
import { ChestForm } from 'lib/Form/ChestForm.js'
import {
  getAllBlockSets,
  getBlockSet,
  stringifyBlocksSetRef,
} from 'modules/WorldEdit/utils/blocksSet.js'
import { ActionForm, BUTTON, GAME_UTILS, ModalForm } from 'smapi.js'
import { WorldEdit } from '../../class/WorldEdit.js'

const set = new Command({
  name: 'set',
  description: 'Частично или полностью заполняет блоки в выделенной области',
  role: 'moderator',
})

set.string('block').executes((ctx, block) => {
  const we = WorldEdit.forPlayer(ctx.sender)
  if (!we.selectionCuboid) return ctx.reply('§cЗона не выделена!')
  if (!blockIsAvaible(block, ctx.sender)) return

  we.fillBetween(ctx.sender, [BlockPermutation.resolve(block)])
})

set.executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.sender)
  if (!we.selectionCuboid) return ctx.reply('§cЗона не выделена!')
  ctx.reply('§b> §3Закрой чат!')
  setSelection(ctx.sender)
})

/**
 * @typedef {BlockPermutation | import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef} SelectedBlock
 */

const selectedBlocks = {
  /** @type {Record<string, SelectedBlock>} */
  block: {},
  /** @type {Record<string, SelectedBlock>} */
  replaceBlock: {},
}

/**
 * @param {Player} player
 */
export function setSelection(player) {
  const [block, blockDisplay] = use(
    player,
    'block',
    'Блок, которым будет заполнена область'
  )
  const [replaceBlock, replaceBlockDisplay] = use(
    player,
    'replaceBlock',
    'Заменяемый блок'
  )
  new ChestForm('small')
    .title('Заполнение')
    .pattern(
      [0, 0],
      [
        // A
        '         ',
        '  B R D  ',
        '         ',
      ],
      {
        ' ': {
          icon: MinecraftBlockTypes.Air,
        },
        'B': blockDisplay,
        'R': replaceBlockDisplay,
        'D':
          block && replaceBlock
            ? {
                icon: 'textures/ui/check',
                nameTag: 'Заполнить!',
                callback(p) {
                  WorldEdit.forPlayer(player).fillBetween(
                    p,
                    block,
                    replaceBlock
                  )
                },
              }
            : {
                icon: MinecraftBlockTypes.Barrier,
                nameTag: '§cВыбери блоки, чтобы заполнить!',
              },
      }
    )
    .show(player)
}

/**
 *
 * @param {Player} player
 * @param {keyof typeof selectedBlocks} type
 * @returns {[blocks: BlockPermutation[] | undefined, options: Omit<import('lib/Form/ChestForm.js').ChestButtonOptions, 'slot'>]}
 */
function use(player, type, desc = '', onSelect = setSelection) {
  const block = selectedBlocks[type][player.id]

  function btnCallback() {
    selectBlockSource(player).then(e => {
      selectedBlocks[type][player.id] = e
      onSelect(player)
    })
  }

  /** @type {ReturnType<use>} */
  const empty = [
    void 0,
    {
      icon: MinecraftBlockTypes.Barrier,
      nameTag: 'Не выбран',
      description: desc + '. Нажми чтобы выбрать ',
      callback: btnCallback,
    },
  ]
  if (!block) return empty

  /**
   * @type {BlockPermutation[]}
   */
  let result

  /**
   * @type {BlockPermutation}
   */
  let dispaySource

  /**
   * @type {Omit<import('lib/Form/ChestForm.js').ChestButtonOptions, 'slot'>}
   */
  let options = {}

  if (block instanceof BlockPermutation) {
    dispaySource = block
    result = [block]
  } else {
    const set = getBlockSet(block)
    if (!set[0]) return empty
    result = set
    dispaySource = set[0]
    options.nameTag = 'Набор блоков ' + stringifyBlocksSetRef(block)
  }
  options = {
    ...ChestForm.permutationToButton(dispaySource),
    ...options,
    callback: btnCallback,
  }

  options.lore = [desc, '', ...(options.lore ?? [])]

  return [result, options]
}

/**
 * @param {Player} player
 * @returns {Promise<BlockPermutation | import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef>}
 */
function selectBlockSource(player) {
  return new Promise(resolve => {
    const base = new ActionForm('А')
      .addButton('Выбрать набор блоков', () => {
        const blocksSets = getAllBlockSets(player.id)
        const form = new ActionForm('Наборы блоков').addButton(
          ActionForm.backText,
          () => base.show(player)
        )

        for (const blocksSet of Object.keys(blocksSets)) {
          form.addButton(blocksSet, () => resolve([player.id, blocksSet]))
        }

        form.show(player)
      })
      .addButton('Выбрать из инвентаря/под ногами', () => {
        const form = new ChestForm('large')
        const blockBelow = player.dimension.getBlock(player.location)?.below()
        form.pattern([0, 0], ['x<xxBxxxx'], {
          '<': {
            icon: BUTTON['<'],
            callback: () => {
              base.show(player)
            },
          },
          'x': {
            icon: 'textures/blocks/glass',
            nameTag: 'Пусто',
            callback: () => base.show(player),
          },
          'B': {
            ...(blockBelow
              ? ChestForm.permutationToButton(blockBelow.permutation)
              : { icon: MinecraftBlockTypes.Air }),
            description: 'Нажми чтобы выбрать',
            callback: () =>
              resolve(
                blockBelow?.permutation ??
                  BlockPermutation.resolve(MinecraftBlockTypes.Air)
              ),
          },
        })
        const { container } = player.getComponent('inventory')
        /** @type {string[]} */
        const blocks = []
        for (let i = 0; i < container.size; i++) {
          const item = container.getItem(i)
          if (
            !item ||
            !BlockTypes.get(item.typeId) ||
            blocks.includes(item.typeId)
          )
            continue

          const base = 9 * 1 // 1 row

          const typeId = item.typeId

          form.button({
            slot: base + blocks.length,
            icon: typeId,
            nameTag: GAME_UTILS.toNameTag(typeId),
            description: 'Нажми чтобы выбрать',
            callback() {
              resolve(BlockPermutation.resolve(typeId))
            },
          })
          blocks.push(typeId)
        }

        form.show(player)
      })
      .addButton('Ввести ID вручную', () => {
        new ModalForm('Введи айди блока')
          .addTextField('ID блока', 'например, stone')
          .show(player, (ctx, id) => {
            let text = ''
            if (
              !blockIsAvaible(id, {
                tell(m) {
                  text += m
                },
              })
            )
              return ctx.error(text)

            resolve(BlockPermutation.resolve(id))
          })
      })

    base.show(player)
  })
}

const prefix = 'minecraft:'

const blocks = BlockTypes.getAll().map(e => e.id.substring(prefix.length))
/**
 *
 * @param {string} block
 * @param {{tell(s: string): void}} player
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
