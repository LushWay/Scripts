import { Direction, ItemStack, Player } from '@minecraft/server'
import { Vec } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ToolsDataStorage, WorldEditMultiTool } from '../lib/world-edit-multi-tool'
import { WorldEditTool } from '../lib/world-edit-tool'
import { weBrushTool } from './brush'

class MultiBrushTool extends WorldEditMultiTool {
  tools = [weBrushTool as unknown as WorldEditTool]
  id = 'multi-brush'
  name = 'Мульти-кисть'
  typeId = Items.WeBrush

  onUse(player: Player, itemStack: ItemStack, storage: ToolsDataStorage | undefined) {
    this.forEachTool(
      itemStack,
      (proxiedItem, tool, toolData) => {
        if (!tool.onUse) return

        const proxiedPlayer = storage?.spread ? this.proxyPlayer(player, storage.spread) : player
        tool.onUse(proxiedPlayer, proxiedItem, toolData)
      },
      storage?.tools,
    )
  }

  private proxyPlayer(player: Player, spread: number): Player {
    return Object.setPrototypeOf(
      {
        getBlockFromViewDirection: options => {
          const hit = player.getBlockFromViewDirection(options)
          if (hit) {
            const block = hit.block.dimension.getBlock(this.getRandomSpreadLocation(hit.block, spread))
            if (!block) return
            return {
              block,
              face: Direction.Down,
              faceLocation: Vec.down,
            }
          } else return
        },
      } satisfies Partial<Player>,
      player,
    ) as Player
  }

  getRandomSpreadLocation(from: Vector3, spread: number) {
    const half = spread / 2
    const rd = () => Math.randomInt(-half, half)
    return Vec.add(from, { x: rd(), y: rd(), z: rd() })
  }
}

new MultiBrushTool()
