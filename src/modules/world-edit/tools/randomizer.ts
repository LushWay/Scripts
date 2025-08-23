import { ContainerSlot, ItemStack, Player, world } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ModalForm } from 'lib'
import { i18n } from 'lib/i18n/text'
import { isNotPlaying } from 'lib/utils/game'
import { WorldEditTool } from '../lib/world-edit-tool'
import { BlocksSetRef, blocksSetDropdown, getBlocksInSet, stringifyBlocksSetRef } from '../utils/blocks-set'

// TODO Migrate to a custom non-stackable block

class RandomizerTool extends WorldEditTool<{ blocksSet: BlocksSetRef; version: number }> {
  id = 'randomizer'
  name = 'случайный блок из набора'
  typeId = MinecraftBlockTypes.WarpedNylium
  storageSchema = {
    version: 2,

    blocksSet: ['', ''] as BlocksSetRef,
  }

  constructor() {
    super()

    /* Replaces the block with a random block from the storage of the item. */
    world.afterEvents.playerPlaceBlock.subscribe(({ block, player }) => {
      const slot = player.mainhand()
      if (!this.isOurItemType(slot) || !isNotPlaying(player)) return

      const storage = weRandomizerTool.getStorage(slot)
      const blocksSet = getBlocksInSet(storage.blocksSet)

      if (blocksSet.length) {
        player.dimension.getBlock(block.location)?.setPermutation(blocksSet.randomElement())
      } else {
        player.fail(i18n.error`Пустой набор блоков '${stringifyBlocksSetRef(storage.blocksSet)}'! Выберите другой.`)
        weRandomizerTool.editToolForm(slot, player)
      }
    })
  }

  editToolForm(slot: ContainerSlot, player: Player) {
    const storage = this.getStorage(slot)
    new ModalForm('§3' + this.name)
      .addDropdown('Набор блоков', ...blocksSetDropdown(storage.blocksSet, player))
      .show(player, (_, blocksSet) => {
        this.configure(slot, [player.id, blocksSet], storage)
        player.info(i18n`Набор блоков сменен на ${blocksSet}`)
      })
  }

  configure(item: ItemStack | ContainerSlot, blocksSet: BlocksSetRef, storage = this.getStorage(item)) {
    storage.blocksSet = blocksSet
    item.nameTag = `§r§3> §f${blocksSet[1]}`

    item.setLore(this.stringifyLore(storage))
  }

  create(blocksSet: BlocksSetRef) {
    const itemStack = new ItemStack(this.typeId)
    this.configure(itemStack, blocksSet)
    return itemStack
  }
}

export const weRandomizerTool = new RandomizerTool()
