import { ContainerSlot, Player, world } from '@minecraft/server'
import { ActionForm } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { setSelectionMenu } from 'modules/world-edit/commands/region/set/set-selection'
import { WorldEdit } from '../lib/world-edit'
import { WorldEditTool } from '../lib/world-edit-tool'

class WandTool extends WorldEditTool {
  id = 'wand'
  name = 'топор'
  typeId = Items.WeWand

  storageSchema: any

  getMenuButtonName(player: Player) {
    const color = super.getMenuButtonName(player)
    if (color === '') return ''

    const tool = player.mainhand().typeId === this.typeId
    const we = WorldEdit.forPlayer(player)
    const selection = !!we.selection
    return color.slice(0, 2) + (tool ? (selection ? 'Действия с областью' : '§cЗона не выделена!') : 'Получить топор')
  }

  editToolForm(_: ContainerSlot, player: Player, initial: boolean) {
    if (initial) return
    new ActionForm('Действия с областью')
      .addButton('Заполнить/Заменить блоки', () => setSelectionMenu(player))
      .show(player)
  }

  constructor() {
    super()
    world.beforeEvents.itemUseOn.subscribe(event => {
      if (event.itemStack.typeId !== this.typeId || !(event.source instanceof Player)) return

      const we = WorldEdit.forPlayer(event.source)
      const blockLocation = event.block
      const pos = we.pos2
      if (pos.x === blockLocation.x && pos.y === blockLocation.y && pos.z === blockLocation.z) return
      we.pos2 = blockLocation
    })

    world.beforeEvents.playerBreakBlock.subscribe(event => {
      if (event.itemStack?.typeId !== this.typeId) return
      event.cancel = true

      const we = WorldEdit.forPlayer(event.player)
      const pos = we.pos1
      if (pos.x === event.block.location.x && pos.y === event.block.location.y && pos.z === event.block.location.z)
        return

      we.pos1 = event.block.location
    })
  }
}

new WandTool()
