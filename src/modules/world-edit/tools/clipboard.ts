import { ContainerSlot, ItemStack, Player, StructureRotation, system } from '@minecraft/server'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { spawnParticlesInArea } from 'modules/world-edit/config'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { WorldEditTool } from 'modules/world-edit/lib/world-edit-tool'

interface Storage {
  version: number
  mode: 'paste' | 'copy'
}

class ClipboardTool extends WorldEditTool<Storage> {
  id = 'clipboard'
  name = 'Вставить/Отменить'
  typeId = Items.WeTool

  storageSchema = {
    version: 0,
    mode: 'paste' as const,
  }

  editToolForm(slot: ContainerSlot) {
    slot.nameTag = '§r§b> §fВставить/Отменить\n(крадитесь чтобы сменить действие)'
    this.saveStorage(slot, { version: 0, mode: 'paste' })
  }

  onUse(player: Player, item: ItemStack) {
    if (this.getStorage(item, true)?.mode !== 'paste') return

    const we = WorldEdit.forPlayer(player)

    if (player.isSneaking) we.undo(1)
    else we.paste()
  }

  constructor() {
    super()
    this.onInterval(20, (player, storage) => {
      if (storage.mode !== 'paste') return
      const we = WorldEdit.forPlayer(player)

      if (we.currentCopy) {
        const { pastePos1, pastePos2 } = we.pastePositions(StructureRotation.None, we.currentCopy)
        if (!player.isSneaking) system.delay(() => spawnParticlesInArea(pastePos1, pastePos2))
        player.onScreenDisplay.setActionBar(
          `Используйте предмет чтобы\n${
            player.isSneaking ? '§7<Отменить последнее действие>' : '§a<Вставить скопированную область>'
          }`,
          ActionbarPriority.High,
        )
      } else
        player.onScreenDisplay.setActionBar('§cВы ничего не копировали!\nИспользуйте §f.copy', ActionbarPriority.High)
    })
  }
}

new ClipboardTool()
