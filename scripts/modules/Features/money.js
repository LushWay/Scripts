import { world } from '@minecraft/server'
import { CUSTOM_ITEMS } from 'lib/Assets/config.js'
import { emoji } from 'lib/Assets/emoji.js'

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId === CUSTOM_ITEMS.money) {
    const { amount } = event.itemStack
    event.source.success(`§6+${amount}${emoji.money}`)
    event.source.scores.money += amount
    event.source.mainhand().setItem(undefined)
  }
})
