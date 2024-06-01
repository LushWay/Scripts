import { world } from '@minecraft/server'
import { CustomItems } from 'lib/assets/config'
import { emoji } from 'lib/assets/emoji'

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId === CustomItems.Money) {
    const { amount } = event.itemStack
    event.source.success(`§6+${amount}${emoji.money}`)
    event.source.scores.money += amount
    event.source.mainhand().setItem(undefined)
  }
})
