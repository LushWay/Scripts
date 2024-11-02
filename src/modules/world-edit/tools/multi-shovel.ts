import { ItemStack, Player } from '@minecraft/server'
import { Items } from 'lib/assets/custom-items'
import { ToolsDataStorage, WorldEditMultiTool } from '../lib/world-edit-multi-tool'
import { WorldEditTool } from '../lib/world-edit-tool'
import { weRegionTool } from './create-region'
import { weShovelTool } from './shovel'

class MultiShovelTool extends WorldEditMultiTool {
  tools = [weShovelTool as unknown as WorldEditTool, weRegionTool as unknown as WorldEditTool]

  id = 'multi-shovel'
  name = 'Мульти-лопата'
  typeId = Items.WeShovel

  onUse(player: Player, item: ItemStack, storage: ToolsDataStorage): void {
    this.forEachTool(
      item,
      (proxiedItem, tool, toolStorage) => {
        if (!tool.onUse) return
        tool.onUse(player, proxiedItem, toolStorage.d)
      },
      storage.tools,
    )
  }

  constructor() {
    super()
    this.onInterval(10, (player, storage, slot, settings) => {
      this.forEachTool(
        slot,
        (proxiedItem, tool, toolStorage) => {
          if (!tool.interval10) return
          tool.interval10(player, toolStorage, proxiedItem, settings)
        },
        storage.tools,
      )
    })
  }
}

new MultiShovelTool()
