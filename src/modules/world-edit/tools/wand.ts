import { Player, world } from '@minecraft/server'
import { ActionForm } from 'lib'
import { CustomItems } from 'lib/assets/config'
import { setSelection } from 'modules/world-edit/commands/region/set'
import { WorldEdit } from '../lib/world-edit'
import { WorldEditTool } from '../lib/world-edit-tool'

const wand = new WorldEditTool({
  name: 'wand',
  displayName: 'топор',
  itemStackId: CustomItems.WeWand,
  overrides: {
    getMenuButtonName(player) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (super.getMenuButtonName(player) === '') return ''

      const tool = player.mainhand().typeId === this.itemId
      const we = WorldEdit.forPlayer(player)
      const selection = !!we.selection
      return (
        this.getMenuButtonNameColor(player) +
        (tool ? (selection ? 'Действия с областью' : '§cЗона не выделена!') : 'Получить топор')
      )
    },
  },

  editToolForm(slot, player, initial) {
    if (initial) return
    new ActionForm('Действия с областью')
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
  const pos = we.pos2
  if (pos.x === blockLocation.x && pos.y === blockLocation.y && pos.z === blockLocation.z) return
  we.pos2 = blockLocation
})

world.beforeEvents.playerBreakBlock.subscribe(event => {
  if (event.itemStack?.typeId !== wand.itemId) return
  event.cancel = true

  const we = WorldEdit.forPlayer(event.player)
  const pos = we.pos1
  if (pos.x === event.block.location.x && pos.y === event.block.location.y && pos.z === event.block.location.z) return

  we.pos1 = event.block.location
})
