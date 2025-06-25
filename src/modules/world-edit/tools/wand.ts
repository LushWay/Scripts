import { ContainerSlot, Player, world } from '@minecraft/server'
import { Items } from 'lib/assets/custom-items'
import { form } from 'lib/form/new'
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
    form(f => {
      f.title('Действия с областью')
      f.button('Заполнить/Заменить блоки', setSelectionMenu)
    }).show(player)
  }

  constructor() {
    super()
    world.beforeEvents.playerInteractWithBlock.subscribe(event => {
      if (event.itemStack?.typeId !== this.typeId || !event.isFirstEvent) return

      event.cancel = true
      WorldEdit.forPlayer(event.player).pos2 = event.block
    })

    world.beforeEvents.playerBreakBlock.subscribe(event => {
      if (event.itemStack?.typeId !== this.typeId) return

      event.cancel = true
      WorldEdit.forPlayer(event.player).pos1 = event.block.location
    })
  }
}

new WandTool()
