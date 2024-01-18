import { CUSTOM_ITEMS } from 'config.js'
import { WorldEditTool } from 'modules/WorldEdit/class/Tool.js'
import { WorldEdit } from 'modules/WorldEdit/class/WorldEdit.js'
import { spawnParticlesInArea } from 'modules/WorldEdit/config.js'

const clipboard = new WorldEditTool({
  name: 'clipboard',
  displayName: 'Копировать/Вставить',
  itemStackId: CUSTOM_ITEMS.tool,
  loreFormat: {
    version: 0,
    mode: 'paste',
  },
  editToolForm(slot, player) {
    slot.setLore(clipboard.stringifyLore({ version: 0, mode: 'paste' }))
  },
  onUse(player, item) {
    if (clipboard.parseLore(item.getLore(), true)?.mode !== 'paste') return

    const we = WorldEdit.forPlayer(player)

    if (player.isSneaking) {
      we.undo(1)
    } else {
      we.paste(player)
    }
  },

  interval20(player, slot) {
    if (clipboard.parseLore(slot.getLore(), true)?.mode !== 'paste') return

    const we = WorldEdit.forPlayer(player)

    if (we.currentCopy) {
      const { pastePos1, pastePos2 } = we.pastePositions(player, 0, we.currentCopy)
      spawnParticlesInArea(pastePos1, pastePos2)
    }
  },
})
