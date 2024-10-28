import { Items } from 'lib/assets/custom-items'
import { WorldEditMultiTool } from '../lib/world-edit-multi-tool'
import { weBrushTool } from './brush'

class MultiBrushTool extends WorldEditMultiTool {
  tools = [weBrushTool]
}

new MultiBrushTool({
  id: 'multi-brush',
  name: 'Мульти-кисть',
  itemStackId: Items.WeBrush,
})
