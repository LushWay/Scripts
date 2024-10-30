import { Player } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { BUTTON } from 'lib'
import { ChestForm } from 'lib/form/chest'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { ReplaceMode } from 'modules/world-edit/utils/blocks-set'
import { WorldEdit } from '../../../lib/world-edit'
import { SelectedBlock, useBlockSelection } from './use-block-selection'
import { useReplaceMode } from './use-replace-mode'

const selection = {
  block: new WeakPlayerMap<SelectedBlock>(),
  replaceBlock: new WeakPlayerMap<SelectedBlock>(),
  replaceMode: new WeakPlayerMap<ReplaceMode>(),
}

export function setSelectionMenu(player: Player) {
  const [block, blockButton] = useBlockSelection(player, selection.block, 'Блок, которым будет заполнена область')
  const [replaceBlock, replaceBlockButton] = useBlockSelection(player, selection.replaceBlock, 'Заменяемый блок', {
    notSelected: {
      description: 'Будут заполнены все блоки. Нажми чтобы выбрать конкретные',
      icon: BUTTON.search,
    },
  })
  const [replaceMode, replaceModeButton] = useReplaceMode(player, selection.replaceMode, () => setSelectionMenu(player))

  new ChestForm('small')
    .title('Заполнение')
    .pattern(
      [0, 0],
      [
        /* prettier-ignore-next */
        '         ',
        '  B R D  ',
        '    M    ',
      ],
      {
        ' ': {
          icon: MinecraftBlockTypes.Air,
        },
        'B': blockButton,
        'R': replaceBlockButton,
        'M': replaceModeButton,
        'D': block
          ? {
              icon: 'textures/ui/check',
              nameTag: 'Заполнить!',
              callback() {
                WorldEdit.forPlayer(player).fillBetween(block, replaceBlock, replaceMode)
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

export type ChestButton = Omit<import('lib/form/chest').ChestButtonOptions, 'slot'>
