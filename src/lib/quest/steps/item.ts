import { ItemStack } from '@minecraft/server'
import { Temporary } from 'lib/temporary'
import { QS, QSBuilder } from '../step'

/** Waits for item in the inventory */
export class QSItem extends QS {
  isItem: (item: ItemStack) => boolean = () => false

  protected activate() {
    const hasItem = this.player.container?.slotEntries().some(e => {
      const item = e[1].getItem()
      if (item) return this.isItem(item)
    })

    if (hasItem) return this.next()

    return new Temporary(({ world }) => {
      world.afterEvents.playerInventoryItemChange.subscribe(
        event => {
          if (event.player.id !== this.player.id) return
          if (event.itemStack && this.isItem(event.itemStack)) return this.next()
        },
        { ignoreQuantityChange: true },
      )
    })
  }
}

export class QSItemBuilder extends QSBuilder<QSItem> {
  isItem(isItem: QSItem['isItem']) {
    this.step.isItem = isItem
    return this
  }
}
