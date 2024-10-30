import { Items } from 'lib/assets/custom-items'
import { WorldEditMultiTool } from '../lib/world-edit-multi-tool'
import { WorldEditTool, WorldEditToolInterval } from '../lib/world-edit-tool'
import { weRegionTool } from './create-region'
import { weShovelTool } from './shovel'

class MultiShovelTool extends WorldEditMultiTool {
  tools = [weShovelTool as unknown as WorldEditTool, weRegionTool as unknown as WorldEditTool]

  id = 'multi-shovel'
  name = 'Мульти-лопата'
  typeId = Items.WeShovel

  interval10: WorldEditToolInterval<this> = (player, slot, settings) => {
    this.forEachTool(slot, (proxiedSlot, proxiedTool) => {
      proxiedTool.interval10?.(player, proxiedSlot, settings)
    })
  }
}

new MultiShovelTool()
