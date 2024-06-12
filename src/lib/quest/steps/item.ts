import { ContainerSlot } from '@minecraft/server'
import { InventoryIntervalAction } from 'lib/action'
import { QS, QSBuilder } from '../step'

/** Waits for item in the inventory */
export class QSItem extends QS {
  isItem: (item: ContainerSlot) => boolean

  protected activate: QS.Activator<this> = ctx => {
    const action = InventoryIntervalAction.subscribe(({ player, slot }) => {
      if (player.id !== ctx.player.id) return
      if (ctx.isItem(slot)) ctx.next()
    })

    return { cleanup: () => InventoryIntervalAction.unsubscribe(action) }
  }
}

export class QSItemBuilder extends QSBuilder<QSItem> {
  isItem(isItem: QSItem['isItem']) {
    this.step.isItem = isItem
    return this
  }
}
