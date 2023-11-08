import { EquipmentSlot, system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { ModalForm } from 'xapi.js'
import { WorldEditTool } from '../builders/ToolBuilder.js'
import { getBlockSet, getBlockSets } from '../commands/general/menu.js'
import { setblock } from '../utils/utils.js'

const nylium = new WorldEditTool({
  name: 'nylium',
  displayName: 'слуйчайный блок из набора',
  itemStackId: MinecraftBlockTypes.WarpedNylium,
  loreFormat: {
    version: 1,

    blocksSet: '',
  },
  editToolForm(slot, player) {
    const lore = nylium.parseLore(slot.getLore())
    new ModalForm('§3' + this.displayName)
      .addDropdown(
        'Набор блоков',
        ...ModalForm.arrayAndDefault(
          Object.keys(getBlockSets(player)),
          lore.blocksSet
        )
      )
      .show(player, (_, blocksSet) => {
        lore.blocksSet = blocksSet
        slot.nameTag = '§r§3> §f' + blocksSet
        slot.setLore(nylium.stringifyLore(lore))
        player.tell('§3> §fНабор блоков сменен на ' + blocksSet)
      })
  },
})

/* Replaces the block with a random block from the lore of the item. */
world.afterEvents.playerPlaceBlock.subscribe(({ block, player }) => {
  if (
    player.getComponent('equippable').getEquipmentSlot(EquipmentSlot.Mainhand)
      .typeId !== nylium.itemId
  )
    return

  system.run(() => {
    const slot = player
      .getComponent('equippable')
      .getEquipmentSlot(EquipmentSlot.Mainhand)
    const blocksSets = getBlockSets(player)
    const name = nylium.parseLore(slot.getLore())?.blocksSet

    if (name in blocksSets) {
      setblock(getBlockSet(blocksSets, name).randomElement(), block.location)
    } else {
      player.tell('§cНеизвестный набор блоков! Выберите существующий из списка')
      nylium.editToolForm?.(slot, player)
    }
  })
})
