import { Player, world } from '@minecraft/server'
import { ActionForm } from 'lib'
import { CUSTOM_ITEMS } from 'lib/assets/config'
import { setSelection } from 'modules/WorldEdit/commands/region/set'
import { WorldEdit } from '../lib/WorldEdit'
import { WorldEditTool } from '../lib/WorldEditTool'

const wand = new WorldEditTool({
  name: 'wand',
  displayName: 'топор',
  itemStackId: CUSTOM_ITEMS.wand,
  overrides: {
    // @ts-expect-error TS(7023) FIXME: 'getMenuButtonName' implicitly has return type 'an... Remove this comment to see the full error message
    getMenuButtonName(player) {
      if (super.getMenuButtonName(player) === '') return ''

      // @ts-expect-error TS(7022) FIXME: 'tool' implicitly has type 'any' because it does n... Remove this comment to see the full error message
      const tool = player.mainhand().typeId === this.itemId
      const we = WorldEdit.forPlayer(player)
      const selection = !!we.selection
      return (
        // @ts-expect-error TS(2339) FIXME: Property 'getMenuButtonNameColor' does not exist o... Remove this comment to see the full error message
        this.getMenuButtonNameColor(player) +
        (tool ? (selection ? 'Действия с областью' : '§cЗона не выделена!') : 'Получить топор')
      )
    },
  },
  editToolForm(slot, player, initial) {
    if (initial) return
    new ActionForm('Действия с областью')
      // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
      .addButton('Заполнить/Заменить блоки', () => {
        setSelection(player)
      })
      .show(player)
  },
})

world.beforeEvents.itemUseOn.subscribe(event => {
  if (event.itemStack.typeId !== wand.itemId || !(event.source instanceof Player)) return

  const we = WorldEdit.forPlayer(event.source)
  const blockLocation = event.block
  const pos = we.pos2 ?? { x: 0, y: 0, z: 0 }
  if (pos.x === blockLocation.x && pos.y === blockLocation.y && pos.z === blockLocation.z) return
  we.pos2 = blockLocation
})

world.beforeEvents.playerBreakBlock.subscribe(event => {
  if (event.itemStack?.typeId !== wand.itemId) return
  event.cancel = true

  const we = WorldEdit.forPlayer(event.player)
  const pos = we.pos1 ?? { x: 0, y: 0, z: 0 }
  if (pos.x === event.block.location.x && pos.y === event.block.location.y && pos.z === event.block.location.z) return

  we.pos1 = event.block.location
})
