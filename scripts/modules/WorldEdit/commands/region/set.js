import { BlockPermutation, BlockTypes, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { ActionForm, BUTTON, ModalForm, typeIdToReadable, util } from 'lib.js'
import { ChestForm } from 'lib/Form/ChestForm.js'
import { inaccurateSearch } from 'lib/Search.js'
import { WEeditBlockStatesMenu } from 'modules/WorldEdit/menu.js'
import { getAllBlockSets, getBlockSet, stringifyBlocksSetRef } from 'modules/WorldEdit/utils/blocksSet.js'
import { WorldEdit } from '../../lib/WorldEdit.js'

const set = new Command('set')
  .setDescription('Частично или полностью заполняет блоки в выделенной области')
  .setPermissions('builder')

set.string('block').executes((ctx, block) => {
  const we = WorldEdit.forPlayer(ctx.player)
  if (!we.selection) return ctx.reply('§cЗона не выделена!')
  if (!blockIsAvaible(block, ctx.player)) return

  we.fillBetween([BlockPermutation.resolve(block)])
})

set.executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.player)
  if (!we.selection) return ctx.reply('§cЗона не выделена!')
  ctx.reply('§b> §3Закрой чат!')
  setSelection(ctx.player)
})

/**
 * @typedef {{ permutations: (BlockPermutation | import('modules/WorldEdit/menu.js').ReplaceTarget)[] }
 *   | { ref: import('modules/WorldEdit/utils/blocksSet.js').BlocksSetRef }
 *   | undefined} SelectedBlock
 */

const selectedBlocks = {
  /** @type {Record<string, SelectedBlock>} */
  block: {},
  /** @type {Record<string, SelectedBlock>} */
  replaceBlock: {},
}

/** @param {Player} player */
export function setSelection(player) {
  const [block, blockDisplay] = use(player, 'block', 'Блок, которым будет заполнена область')
  const [replaceBlock, replaceBlockDisplay] = use(player, 'replaceBlock', 'Заменяемый блок', {
    notSelected: {
      description: 'Будут заполнены все блоки. Нажми чтобы выбрать конкретные',
      icon: 'textures/ui/magnifying_glass.png',
    },
  })
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
        'D': block
          ? {
              icon: 'textures/ui/check',
              nameTag: 'Заполнить!',
              callback() {
                WorldEdit.forPlayer(player).fillBetween(block, replaceBlock)
              },
            }
          : {
              icon: MinecraftBlockTypes.Barrier,
              nameTag: '§cВыбери блок, чтобы заполнить!',
            },
      },
    )
    .show(player)
}

/** @typedef {Omit<import('lib/Form/ChestForm.js').ChestButtonOptions, 'slot'>} ButtonOptions */

/**
 * @param {Player} player
 * @param {keyof typeof selectedBlocks} type
 * @param {string} [desc=''] Default is `''`
 * @param {object} [param3={}] Default is `{}`
 * @param {(player: Player) => void} [param3.onSelect=setSelection] Default is `setSelection`
 * @param {Partial<ButtonOptions>} [param3.notSelected]
 * @returns {[
 *   blocks: (BlockPermutation | import('modules/WorldEdit/menu.js').ReplaceTarget)[] | undefined,
 *   options: ButtonOptions,
 * ]}
 */
function use(player, type, desc = '', { onSelect = setSelection, notSelected = {} } = {}) {
  const block = selectedBlocks[type][player.id]

  const callback = () => {
    selectBlockSource(player, () => onSelect(player), block).then(e => {
      selectedBlocks[type][player.id] = e
      onSelect(player)
    })
  }

  /** @type {ReturnType<use>} */
  const empty = [
    void 0,
    {
      callback,
      icon: MinecraftBlockTypes.Barrier,
      nameTag: desc,
      description: 'Не выбран. Нажми чтобы выбрать.',
      ...notSelected,
    },
  ]
  if (!block) return empty

  /** @type {(BlockPermutation | import('modules/WorldEdit/menu.js').ReplaceTarget)[]} */
  let result

  /** @type {Pick<BlockPermutation, 'getAllStates' | 'type'>} */
  let dispaySource

  /** @type {Omit<import('lib/Form/ChestForm.js').ChestButtonOptions, 'slot'>} */
  let options = {}

  if ('permutations' in block) {
    const type =
      block.permutations[0] instanceof BlockPermutation
        ? block.permutations[0].type
        : BlockTypes.get(block.permutations[0].typeId)

    if (!type) {
      player.tell('AAAAAAAAAAA ВСЕ СЛОМАЛОСЬ')
      throw new Error('AAAAAAAAAAAAAAAAAA')
    }

    dispaySource =
      block.permutations[0] instanceof BlockPermutation
        ? block.permutations[0]
        : {
            getAllStates() {
              if (block.permutations[0] instanceof BlockPermutation) return block.permutations[0].getAllStates()
              return block.permutations[0].states
            },
            type: type,
          }
    result = block.permutations
  } else {
    const set = getBlockSet(block.ref)
    if (!set[0]) return empty
    result = set
    dispaySource = set[0]
    options.nameTag = desc
    desc = 'Набор блоков ' + stringifyBlocksSetRef(block.ref)
  }
  options = {
    ...ChestForm.permutationToButton(dispaySource),
    ...options,
    callback,
  }

  options.lore = [desc, '', ...(options.lore ?? [])]

  return [result, options]
}

/**
 * @param {Player} player
 * @param {() => void} back
 * @param {SelectedBlock} [currentSelection]
 * @returns {Promise<SelectedBlock>}
 */
function selectBlockSource(player, back, currentSelection) {
  const selectedBlocksSet = currentSelection && 'ref' in currentSelection && stringifyBlocksSetRef(currentSelection.ref)

  const selectedBlock =
    currentSelection &&
    'permutations' in currentSelection &&
    currentSelection.permutations &&
    currentSelection.permutations[0] &&
    typeIdToReadable(
      currentSelection.permutations[0] instanceof BlockPermutation
        ? currentSelection.permutations[0].type.id
        : currentSelection.permutations[0].typeId,
    )

  const promise = new Promise(resolve => {
    const base = new ActionForm('Выбери блок/набор блоков')
      .addButton(ActionForm.backText, back)
      .addButton(
        selectedBlocksSet ? `§2Сменить выбранный набор:\n§7${selectedBlocksSet}` : 'Выбрать набор блоков',
        () => {
          const blocksSets = getAllBlockSets(player.id)
          const form = new ActionForm('Наборы блоков').addButton(ActionForm.backText, () => base.show(player))

          for (const blocksSet of Object.keys(blocksSets)) {
            form.addButton(blocksSet, () => resolve({ ref: [player.id, blocksSet] }))
          }

          form.show(player)
        },
      )
      .addButton(
        selectedBlock ? `§2Сменить выбранный блок: §f${selectedBlock}` : 'Выбрать из инвентаря/под ногами',
        () => {
          const form = new ChestForm('large')
          const blockBelow = player.dimension.getBlock(player.location)?.below()
          const blockFromView = player.getBlockFromViewDirection({
            includeLiquidBlocks: true,
            includePassableBlocks: true,
            maxDistance: 120,
          })
          form.pattern([0, 0], ['x<xxBxxGx'], {
            '<': {
              icon: BUTTON['<'],
              callback: () => base.show(player),
            },
            'x': {
              icon: 'textures/blocks/glass',
              nameTag: 'Пусто',
            },
            'B': {
              ...(blockBelow
                ? ChestForm.permutationToButton(blockBelow.permutation)
                : { icon: MinecraftBlockTypes.Air }),
              description: 'Нажми чтобы выбрать',
              callback: () =>
                resolve({
                  permutations: [blockBelow?.permutation ?? BlockPermutation.resolve(MinecraftBlockTypes.Air)],
                }),
            },
            'G': {
              ...(blockFromView?.block
                ? ChestForm.permutationToButton(blockFromView?.block.permutation)
                : { icon: MinecraftBlockTypes.Air }),
              description: 'Нажми чтобы выбрать блок на который смотришь',
              callback: () =>
                resolve({
                  permutations: [blockBelow?.permutation ?? BlockPermutation.resolve(MinecraftBlockTypes.Air)],
                }),
            },
          })
          const { container } = player
          if (!container) return
          /** @type {string[]} */
          const blocks = []
          for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i)
            if (!item || !BlockTypes.get(item.typeId) || blocks.includes(item.typeId)) continue

            const base = 9 * 1 // 1 row

            const typeId = item.typeId

            form.button({
              slot: base + blocks.length,
              icon: typeId,
              nameTag: typeIdToReadable(typeId),
              description: 'Нажми чтобы выбрать',
              callback() {
                resolve({ permutations: [BlockPermutation.resolve(typeId)] })
              },
            })
            blocks.push(typeId)
          }

          form.show(player)
        },
      )

    if (currentSelection && 'permutations' in currentSelection && currentSelection.permutations[0])
      base.addButton('§2Редактировать свойства выбранного блока', async () => {
        const sel = currentSelection.permutations[0]
        currentSelection.permutations[0] = {
          typeId: sel instanceof BlockPermutation ? sel.type.id : sel.typeId,
          states: await WEeditBlockStatesMenu(
            player,
            sel instanceof BlockPermutation ? sel.getAllStates() : sel.states,
            () => base.show(player),
          ),
        }

        resolve(currentSelection)
      })

    base
      .addButton('Ввести ID вручную', () => {
        enterBlockId(player, resolve)
      })
      .addButton('§cОчистить выделение', () => {
        resolve(undefined)
      })

    base.show(player)
  })

  promise.catch(util.error)

  return promise
}

/**
 * @param {Player} player
 * @param {(v: SelectedBlock) => void} resolve
 */
function enterBlockId(player, resolve, error = '') {
  new ModalForm('Введи айди блока').addTextField(error + 'ID блока', 'например, stone').show(player, (_, id) => {
    let text = ''
    if (
      !blockIsAvaible(id, {
        tell(m) {
          text += m
        },
      })
    )
      return enterBlockId(player, resolve, text + '\n')

    resolve({ permutations: [BlockPermutation.resolve(id)] })
  })
}

const prefix = 'minecraft:'

const blocks = BlockTypes.getAll().map(e => e.id.substring(prefix.length))

/**
 * @param {string} block
 * @param {{ tell(s: string): void }} player
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

  if (!search[0] || (search[0] && search[0][1] < options.minMatchTriggerValue)) return false

  const suggest = (/** @type {[string, number]} */ a) => `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%%)§c`

  let suggestion = '§cВы имели ввиду ' + suggest(search[0])
  const firstValue = search[0][1]
  search = search
    .filter(e => firstValue - e[1] <= options.maxDifferenceBeetwenSuggestions)
    .slice(1, options.maxSuggestionsCount)

  for (const [i, e] of search.entries()) suggestion += `${i + 1 === search.length ? ' или ' : ', '}${suggest(e)}`

  player.tell(suggestion + '§c?')
  return false
}
