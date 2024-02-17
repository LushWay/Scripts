import { ContainerSlot, ItemStack, Player, system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { ModalForm } from 'lib.js'
import { isBuilding } from 'modules/Build/isBuilding.js'
import { WorldEditTool } from '../class/WorldEditTool.js'
import { blockSetDropdown, getBlockSet, stringifyBlocksSetRef } from '../utils/blocksSet.js'

const nylium = new WorldEditTool({
  name: 'nylium',
  displayName: 'слуйчайный блок из набора',
  itemStackId: MinecraftBlockTypes.WarpedNylium,
  loreFormat: {
    version: 2,

    /** @type {[string, string]} */
    blocksSet: ['', ''],
  },
  editToolForm(slot, player) {
    const lore = nylium.parseLore(slot.getLore())
    new ModalForm('§3' + this.displayName)
      .addDropdown('Набор блоков', ...blockSetDropdown(lore.blocksSet, player))
      .show(player, (_, blocksSet) => {
        createNylium(slot, player, blocksSet, lore)
        player.info('Набор блоков сменен на ' + blocksSet)
      })
  },
})

/**
 *
 * @param {ItemStack | ContainerSlot} slot
 * @param {Player} player
 * @param {string} blocksSet
 */
export function createNylium(slot, player, blocksSet, lore = nylium.parseLore(slot.getLore())) {
  lore.blocksSet = [player.id, blocksSet]
  slot.nameTag = '§r§3> §f' + blocksSet
  slot.setLore(nylium.stringifyLore(lore))
}

/* Replaces the block with a random block from the lore of the item. */
world.afterEvents.playerPlaceBlock.subscribe(({ block, player }) => {
  if (player.mainhand().typeId !== nylium.itemId || !isBuilding(player)) return

  system.delay(() => {
    const slot = player.mainhand()
    const lore = nylium.parseLore(slot.getLore())
    const blocksSet = getBlockSet(lore.blocksSet)

    if (blocksSet.length) {
      system.runTimeout(
        () => {
          player.dimension.getBlock(block.location)?.setPermutation(blocksSet.randomElement())
        },
        'nylium place',
        0
      )
    } else {
      player.fail(`Пустой набор блоков '§f${stringifyBlocksSetRef(lore.blocksSet)}'§c! Выберите другой.`)
      nylium.editToolForm?.(slot, player)
    }
  })
})
