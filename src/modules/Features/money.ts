import { world } from '@minecraft/server'
import { CUSTOM_ITEMS } from 'lib/assets/config'
import { emoji } from 'lib/assets/emoji'

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId === CUSTOM_ITEMS.money) {
    const { amount } = event.itemStack
    event.source.success(`§6+${amount}${emoji.money}`)
    event.source.scores.money += amount
    event.source.mainhand().setItem(undefined)
  }
})
