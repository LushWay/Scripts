import { StructureRotation, system } from '@minecraft/server'
import { CUSTOM_ITEMS } from 'lib/assets/config'
import { spawnParticlesInArea } from 'modules/world-edit/config'
import { WorldEdit } from 'modules/world-edit/lib/WorldEdit'
import { WorldEditTool } from 'modules/world-edit/lib/WorldEditTool'

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
    slot.nameTag = '§r§b> §fКопировать/Вставить/Отменить\n(крадитесь чтобы сменить действие)'
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
