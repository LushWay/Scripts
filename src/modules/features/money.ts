import { world } from '@minecraft/server'
import { CustomItems } from 'lib/assets/config'
import { Sounds } from 'lib/assets/custom-sounds'
import { emoji } from 'lib/assets/emoji'

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId === CustomItems.Money) {
    const { amount } = event.itemStack
    event.source.info(`§6+${amount}${emoji.money}`, false)
    event.source.scores.money += amount
    event.source.playSound(Sounds['lw.pay'])
    event.source.mainhand().setItem(undefined)
  }
})
