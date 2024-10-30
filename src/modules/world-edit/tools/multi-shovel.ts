import { Items } from 'lib/assets/custom-items'
import { WorldEditMultiTool } from '../lib/world-edit-multi-tool'
import { WorldEditTool } from '../lib/world-edit-tool'
import { weRegionTool } from './create-region'
import { weShovelTool } from './shovel'

class MultiShovelTool extends WorldEditMultiTool {
  tools = [weShovelTool as unknown as WorldEditTool, weRegionTool as unknown as WorldEditTool]

  id = 'multi-shovel'
  name = 'Мульти-лопата'
  typeId = Items.WeShovel

  constructor() {
    super()
    this.onInterval(10, (player, storage, slot, settings) => {
      this.forEachTool(
        slot,
        (proxiedSlot, tool, toolStorage) => {
          if (!tool.interval10) return

          tool.interval10(player, toolStorage.d, proxiedSlot, settings)
        },
        storage.tools,
      )
    })
  }
}

new MultiShovelTool()
