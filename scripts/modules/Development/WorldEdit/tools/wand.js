import { Player, Vector, world } from '@minecraft/server'
import { WorldEditTool } from '../class/Tool.js'
import { WorldEdit } from '../class/WorldEdit.js'

const wand = new WorldEditTool({
  name: 'wand',
  displayName: 'топор',
  itemStackId: 'we:wand',
  overrides: {
    getMenuButtonName(player) {
      if (super.getMenuButtonName(player) === '') return ''
      return this.getMenuButtonNameColor(player) + 'Получить топор'
    },
  },
})

world.beforeEvents.itemUseOn.subscribe(event => {
  if (
    event.itemStack.typeId !== wand.itemId ||
    !(event.source instanceof Player)
  )
    return

  const we = WorldEdit.forPlayer(event.source)
  const blockLocation = event.block
  const pos = we.pos2 ?? { x: 0, y: 0, z: 0 }
  if (
    pos.x === blockLocation.x &&
    pos.y === blockLocation.y &&
    pos.z === blockLocation.z
  )
    return
  we.pos2 = blockLocation
  event.source.tell(
    `§d►2◄§f (use) ${Vector.string(we.pos2)}` //§r
  )
})

world.beforeEvents.playerBreakBlock.subscribe(event => {
  if (event.itemStack?.typeId !== wand.itemId) return

  const we = WorldEdit.forPlayer(event.player)
  const pos = we.pos1 ?? { x: 0, y: 0, z: 0 }
  if (
    pos.x === event.block.location.x &&
    pos.y === event.block.location.y &&
    pos.z === event.block.location.z
  )
    return

  we.pos1 = event.block.location
  event.player.tell(`§5►1◄§r (break) ${Vector.string(we.pos1)}`)

  event.cancel = true
})
