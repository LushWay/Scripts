import { ContainerSlot, ItemStack, Player, StructureRotation, system } from '@minecraft/server'
import { Items } from 'lib/assets/custom-items'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { spawnParticlesInArea } from 'modules/world-edit/config'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { WorldEditTool, WorldEditToolInterval } from 'modules/world-edit/lib/world-edit-tool'

interface Storage {
  version: number
  mode: 'paste' | 'copy'
}

class ClipboardTool extends WorldEditTool<Storage> {
  id = 'clipboard'
  name = 'Копировать/Вставить'
  typeId = Items.WeTool

  storageSchema = {
    version: 0,
    mode: 'paste' as const,
  }

  editToolForm(slot: ContainerSlot) {
    this.saveStorage(slot, { version: 0, mode: 'paste' })
    slot.nameTag = '§r§b> §fКопировать/Вставить/Отменить\n(крадитесь чтобы сменить действие)'
  }

  onUse(player: Player, item: ItemStack) {
    if (this.getStorage(item, true)?.mode !== 'paste') return

    const we = WorldEdit.forPlayer(player)

    if (player.isSneaking) we.undo(1)
    else we.paste()
  }

  interval20: WorldEditToolInterval<this> = (player, slot) => {
    if (this.getStorage(slot, true)?.mode !== 'paste') return
    const we = WorldEdit.forPlayer(player)

    if (we.currentCopy) {
      const { pastePos1, pastePos2 } = we.pastePositions(StructureRotation.None, we.currentCopy)
      system.delay(() => spawnParticlesInArea(pastePos1, pastePos2))
      player.onScreenDisplay.setActionBar(
        `Используйте предмет чтобы\n${
          player.isSneaking ? '<Отменить последнее действие>' : '<Вставить скопированную область>'
        }`,
        ActionbarPriority.UrgentNotificiation,
      )
    } else player.onScreenDisplay.setActionBar('§cВы ничего не копировали!', ActionbarPriority.UrgentNotificiation)
  }
}

new ClipboardTool()
