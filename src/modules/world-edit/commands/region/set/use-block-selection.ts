import { BlockPermutation, BlockTypes, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ActionForm, BUTTON, ChestForm, ModalForm, inspect, translateTypeId } from 'lib'
import { i18n } from 'lib/i18n/text'
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
  const selection = storage.get(player.id)

  const callback = () => {
    selectBlockSource(player, () => onSelect(player), selection).then(e => {
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
  if (!selection) return empty

  let result: (BlockPermutation | ReplaceTarget)[]
  let dispaySource: Pick<BlockPermutation, 'getAllStates' | 'type'>
  let options = {} as ChestButton

  if ('permutations' in selection) {
    const block = selection.permutations[0]

    if (!block) {
      player.fail('No permutations selected')
      throw new Error('No permutations selected')
    }

    const type = block instanceof BlockPermutation ? block.type : BlockTypes.get(block.typeId)

    if (!type) {
      player.fail(i18n.error`Неизвестный тип блока: ${inspect(selection.permutations[0])}`)
      throw new Error(`Unknown block type: ${inspect(selection.permutations[0])}`)
    }

    dispaySource =
      block instanceof BlockPermutation
        ? block
        : {
            getAllStates: () => (block instanceof BlockPermutation ? block.getAllStates() : block.states),
            type: type,
          }
    result = selection.permutations
  } else {
    const set = getBlocksInSet(selection.ref)
    if (!set[0]) return empty
    result = set
    dispaySource = set[0]

    options.nameTag = desc
    desc = 'Набор блоков ' + stringifyBlocksSetRef(selection.ref)
  }
  options = {
    ...ChestForm.permutationToButton(dispaySource, player),
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
    translateTypeId(
      currentSelection.permutations[0] instanceof BlockPermutation
        ? currentSelection.permutations[0].type.id
        : currentSelection.permutations[0].typeId,
      player.lang,
    )

  const promise = new Promise<SelectedBlock>(resolve => {
    const base = new ActionForm('Выбери блок/набор блоков')
      .button(ActionForm.backText.to(player.lang), back)
      .button(selectedBlocksSet ? `§2Сменить выбранный набор:\n§7${selectedBlocksSet}` : 'Выбрать набор блоков', () => {
        const blocksSets = getAllBlocksSets(player.id)

        const form = new ActionForm('Наборы блоков').button(ActionForm.backText.to(player.lang), () =>
          base.show(player),
        )

        for (const blocksSet of Object.keys(blocksSets)) {
          form.button(blocksSet, () => resolve({ ref: [player.id, blocksSet] }))
        }

        form.show(player)
      })
      .button(
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
                ? ChestForm.permutationToButton(blockBelow.permutation, player)
                : { icon: MinecraftBlockTypes.Air }),
              description: 'Нажми чтобы выбрать',
              callback: () =>
                resolve({
                  permutations: [blockBelow?.permutation ?? BlockPermutation.resolve(MinecraftBlockTypes.Air)],
                }),
            },
            'G': {
              ...(blockFromView?.block
                ? ChestForm.permutationToButton(blockFromView.block.permutation, player)
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
              nameTag: translateTypeId(typeId, player.lang),
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
      base.button('§2Редактировать свойства выбранного блока', async () => {
        const selection = currentSelection.permutations[0]
        if (!selection) throw new Error('No selection!')

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
      .button('Ввести ID вручную', () => {
        selectBlockByIdModal(player, resolve)
      })
      .button('§cОчистить выделение', () => {
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
    if (!blockIsAvaible(id, { tell: m => (error += m.to(player.lang)), lang: player.lang }))
      return selectBlockByIdModal(player, resolve, `${error}\n`)

    resolve({ permutations: [BlockPermutation.resolve(id)] })
  })
}
export type SelectedBlock = { permutations: (BlockPermutation | ReplaceTarget)[] } | { ref: BlocksSetRef } | undefined
