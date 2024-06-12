import { StructureRotation, system } from '@minecraft/server'
import { CustomItems } from 'lib/assets/config'
import { spawnParticlesInArea } from 'modules/world-edit/config'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { WorldEditTool } from 'modules/world-edit/lib/world-edit-tool'

const clipboard = new WorldEditTool({
  name: 'clipboard',
  displayName: 'Копировать/Вставить',
  itemStackId: CustomItems.WeTool,
  loreFormat: {
    version: 0,
    mode: 'paste',
  },

  editToolForm(slot, player) {
    slot.setLore(clipboard.stringifyLore({ version: 0, mode: 'paste' }))
    slot.nameTag = '§r§b> §fКопировать/Вставить/Отменить\n(крадитесь чтобы сменить действие)'
  },

  onUse(player, item) {
    if (clipboard.parseLore(item.getLore(), true)?.mode !== 'paste') return

    const we = WorldEdit.forPlayer(player)

    if (player.isSneaking) {
      we.undo(1)
    } else {
      we.paste()
    }
  },

  interval20(player, slot) {
    if (clipboard.parseLore(slot.getLore(), true)?.mode !== 'paste') return

    const we = WorldEdit.forPlayer(player)

    if (we.currentCopy) {
      const { pastePos1, pastePos2 } = we.pastePositions(StructureRotation.None, we.currentCopy)
      system.delay(() => spawnParticlesInArea(pastePos1, pastePos2))
      player.onScreenDisplay.setActionBar(
        `Используйте предмет чтобы\n${
          player.isSneaking ? '<Отменить последнее действие>' : '<Вставить скопированную область>'
        }`,
      )
    } else {
      player.onScreenDisplay.setActionBar('§cВы ничего не копировали!')
    }
  },
})
