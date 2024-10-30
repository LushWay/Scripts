import { BlockPermutation, BlockTypes, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ActionForm, BUTTON, ChestForm, ModalForm, inspect, typeIdToReadable } from 'lib'
import { t } from 'lib/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { WEeditBlockStatesMenu } from 'modules/world-edit/menu'
import {
  BlocksSetRef,
  ReplaceTarget,
  getAllBlocksSets,
  getBlocksInSet,
  stringifyBlocksSetRef,
  toReplaceTarget,
} from 'modules/world-edit/utils/blocks-set'
import { blockIsAvaible } from './block-is-avaible'
import { ChestButton, setSelectionMenu } from './set-selection'

export function useBlockSelection(
  player: Player,
  storage: WeakPlayerMap<SelectedBlock>,
  desc = '',
  {
    onSelect = setSelectionMenu,
    notSelected = {},
  }: { onSelect?: (player: Player) => void; notSelected?: Partial<ChestButton> } = {},
): [blocks: (BlockPermutation | ReplaceTarget)[] | undefined, options: ChestButton] {
  const block = storage.get(player.id)

  const callback = () => {
    selectBlockSource(player, () => onSelect(player), block).then(e => {
      storage.set(player, e)
      onSelect(player)
    })
  }

  const empty: ReturnType<typeof useBlockSelection> = [
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
  let options = {} as ChestButton

  if ('permutations' in block) {
    const type =
      block.permutations[0] instanceof BlockPermutation
        ? block.permutations[0].type
        : BlockTypes.get(block.permutations[0].typeId)

    if (!type) {
      player.fail(t.error`Неизвестный тип блока: ${inspect(block.permutations[0])}`)
      throw new Error(`Unknown block type: ${inspect(block.permutations[0])}`)
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
        selectBlockByIdModal(player, resolve)
      })
      .addButton('§cОчистить выделение', () => {
        resolve(undefined)
      })

    base.show(player)
  })

  promise.catch((e: unknown) => console.error(e))

  return promise
}
function selectBlockByIdModal(player: Player, resolve: (v: SelectedBlock) => void, error = '') {
  new ModalForm('Введи айди блока').addTextField(`${error}ID блока`, 'например, stone').show(player, (_, id) => {
    let error = ''
    if (!blockIsAvaible(id, { fail: m => (error += m) })) return selectBlockByIdModal(player, resolve, `${error}\n`)

    resolve({ permutations: [BlockPermutation.resolve(id)] })
  })
}
export type SelectedBlock = { permutations: (BlockPermutation | ReplaceTarget)[] } | { ref: BlocksSetRef } | undefined
