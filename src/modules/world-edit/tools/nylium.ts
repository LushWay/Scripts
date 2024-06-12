import { ContainerSlot, ItemStack, Player, system, world } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ModalForm } from 'lib'
import { isBuilding } from 'lib/game-utils'
import { WorldEditTool } from '../lib/world-edit-tool'
import { BlocksSetRef, blocksSetDropdown, getBlocksSetByRef, stringifyBlocksSetRef } from '../utils/blocks-set'

const nylium = new WorldEditTool({
  name: 'nylium',
  displayName: 'слуйчайный блок из набора',
  itemStackId: MinecraftBlockTypes.WarpedNylium,
  loreFormat: {
    version: 2,

    blocksSet: ['', ''] as BlocksSetRef,
  },

  editToolForm(slot, player) {
    const lore = nylium.parseLore(slot.getLore())
    new ModalForm('§3' + this.displayName)

      .addDropdown('Набор блоков', ...blocksSetDropdown(lore.blocksSet, player))
      .show(player, (_, blocksSet) => {
        configureNylium(slot, player, blocksSet, lore)
        player.info('Набор блоков сменен на ' + blocksSet)
      })
  },
})

export function configureNylium(
  item: ItemStack | ContainerSlot,
  player: Player,
  blocksSet: string,
  lore = nylium.parseLore(item.getLore()),
) {
  lore.blocksSet = [player.id, blocksSet]
  item.nameTag = '§r§3> §f' + blocksSet

  item.setLore(nylium.stringifyLore(lore))
}

/* Replaces the block with a random block from the lore of the item. */
world.afterEvents.playerPlaceBlock.subscribe(({ block, player }) => {
  if (player.mainhand().typeId !== nylium.itemId || !isBuilding(player)) return

  system.delay(() => {
    const slot = player.mainhand()
    const lore = nylium.parseLore(slot.getLore())

    const blocksSet = getBlocksSetByRef(lore.blocksSet)

    if (blocksSet.length) {
      system.runTimeout(
        () => {
          player.dimension.getBlock(block.location)?.setPermutation(blocksSet.randomElement())
        },
        'nylium place',
        0,
      )
    } else {
      player.fail(`Пустой набор блоков '§f${stringifyBlocksSetRef(lore.blocksSet)}'§c! Выберите другой.`)
      nylium.editToolForm?.(slot, player)
    }
  })
})
