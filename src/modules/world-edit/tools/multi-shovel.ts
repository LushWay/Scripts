import { Items } from 'lib/assets/custom-items'
import { WorldEditMultiTool } from '../lib/world-edit-multi-tool'
import { weRegionTool } from './create-region'
import { weShovelTool } from './shovel'

class MultiShovelTool extends WorldEditMultiTool {
  tools = [weShovelTool, weRegionTool]
}

const multiShovel = new MultiShovelTool({
  id: 'multi-shovel',
  name: 'Мульти-лопата',
  itemStackId: Items.WeShovel,

  interval10(player, slot, settings) {
    const storage = multiShovel.getStorage(slot)
    for (const item of storage) {
      const itemTool = multiShovel.getToolByItem(item)
      if (!itemTool) continue

      const proxiedTool = multiShovel.proxyTool(itemTool, item)
      const proxiedSlot = multiShovel.proxySlot(slot, storage, item)

      proxiedTool.interval10?.(player, proxiedSlot, settings)
    }
  },
})
