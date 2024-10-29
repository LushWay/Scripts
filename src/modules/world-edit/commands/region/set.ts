import { BlockPermutation, BlockTypes, Player } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ActionForm, BUTTON, ModalForm } from 'lib'
import { ChestForm } from 'lib/form/chest'
import { inaccurateSearch } from 'lib/search'
import { typeIdToReadable } from 'lib/utils/lang'
import { WEeditBlockStatesMenu } from 'modules/world-edit/menu'
import {
  getAllBlocksSets,
  getBlocksInSet,
  ReplaceTarget,
  stringifyBlocksSetRef,
  toReplaceTarget,
} from 'modules/world-edit/utils/blocks-set'
import { WorldEdit } from '../../lib/world-edit'

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

type SelectedBlock =
  | { permutations: (BlockPermutation | ReplaceTarget)[] }
  | { ref: import('modules/world-edit/utils/blocks-set').BlocksSetRef }
  | undefined

const selectedBlocks = {
  block: {} as Record<string, SelectedBlock>,
  replaceBlock: {} as Record<string, SelectedBlock>,
}

export function setSelection(player: Player) {
  const [block, blockDisplay] = use(player, 'block', 'Блок, которым будет заполнена область')
  const [replaceBlock, replaceBlockDisplay] = use(player, 'replaceBlock', 'Заменяемый блок', {
    notSelected: {
      description: 'Будут заполнены все блоки. Нажми чтобы выбрать конкретные',
      icon: 'textures/ui/custom/search.png',
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

type ButtonOptions = Omit<import('lib/form/chest').ChestButtonOptions, 'slot'>

function use(
  player: Player,
  type: keyof typeof selectedBlocks,
  desc = '',
  {
    onSelect = setSelection,
    notSelected = {},
  }: { onSelect?: (player: Player) => void; notSelected?: Partial<ButtonOptions> } = {},
): [blocks: (BlockPermutation | ReplaceTarget)[] | undefined, options: ButtonOptions] {
  const block = selectedBlocks[type][player.id]

  const callback = () => {
    selectBlockSource(player, () => onSelect(player), block).then(e => {
      selectedBlocks[type][player.id] = e
      onSelect(player)
    })
  }

  const empty: ReturnType<typeof use> = [
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

  let result: (BlockPermutation | ReplaceTarget)[]
  let dispaySource: Pick<BlockPermutation, 'getAllStates' | 'type'>
  let options = {} as ButtonOptions

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
    const set = getBlocksInSet(block.ref)
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

function selectBlockSource(player: Player, back: () => void, currentSelection: SelectedBlock) {
  const selectedBlocksSet = currentSelection && 'ref' in currentSelection && stringifyBlocksSetRef(currentSelection.ref)

  const selectedBlock =
    currentSelection &&
    'permutations' in currentSelection &&
    currentSelection.permutations[0] &&
    typeIdToReadable(
      currentSelection.permutations[0] instanceof BlockPermutation
        ? currentSelection.permutations[0].type.id
        : currentSelection.permutations[0].typeId,
    )

  const promise = new Promise<SelectedBlock>(resolve => {
    const base = new ActionForm('Выбери блок/набор блоков')
      .addButton(ActionForm.backText, back)
      .addButton(
        selectedBlocksSet ? `§2Сменить выбранный набор:\n§7${selectedBlocksSet}` : 'Выбрать набор блоков',
        () => {
          const blocksSets = getAllBlocksSets(player.id)

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
              callback: () => void base.show(player),
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
                ? ChestForm.permutationToButton(blockFromView.block.permutation)
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

          const blocks: string[] = []
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
        const selection = currentSelection.permutations[0]
        currentSelection.permutations[0]
        const states = await WEeditBlockStatesMenu(
          player,
          selection instanceof BlockPermutation ? selection.getAllStates() : selection.states,
          () => base.show(player),
        )

        currentSelection.permutations[0] = toReplaceTarget(
          BlockPermutation.resolve(
            selection instanceof BlockPermutation ? selection.type.id : selection.typeId,
            states,
          ),
        )

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

  promise.catch((e: unknown) => console.error(e))

  return promise
}

/**
 * @param {Player} player
 * @param {(v: SelectedBlock) => void} resolve
 */

function enterBlockId(player: Player, resolve: (v: SelectedBlock) => void, error = '') {
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

function blockIsAvaible(block: string, player: { tell(s: string): void }): boolean {
  if (blocks.includes(block)) return true

  player.tell('§cБлока §f' + block + '§c не существует.')

  let search = inaccurateSearch(block, blocks)

  const options = {
    minMatchTriggerValue: 0.5,
    maxDifferenceBeetwenSuggestions: 0.15,
    maxSuggestionsCount: 3,
  }

  if (!search[0] || (search[0] && search[0][1] < options.minMatchTriggerValue)) return false

  const suggest = (a: [string, number]) => `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%%)§c`

  let suggestion = '§cВы имели ввиду ' + suggest(search[0])
  const firstValue = search[0][1]
  search = search
    .filter(e => firstValue - e[1] <= options.maxDifferenceBeetwenSuggestions)
    .slice(1, options.maxSuggestionsCount)

  for (const [i, e] of search.entries()) suggestion += `${i + 1 === search.length ? ' или ' : ', '}${suggest(e)}`

  player.tell(suggestion + '§c?')
  return false
}
