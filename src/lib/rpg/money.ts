import { Player, world } from '@minecraft/server'
import { CustomItems } from 'lib/assets/config'
import { Sounds as CustomSounds } from 'lib/assets/custom-sounds'
import { emoji } from 'lib/assets/emoji'

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId === CustomItems.Money) {
    givePlayerMoneyAndXp(event.source, event.itemStack.amount)
    event.source.mainhand().setItem(undefined)
  }
})

export function givePlayerMoneyAndXp(player: Player, amount: number, xp?: number) {
  player.scores.money += amount
  player.tell(`§6+${amount}${emoji.money}${xp ? ` §a+${xp}lvl` : ''}`)
  if (xp) player.addLevels(xp)
  player.playSound(CustomSounds['lw.pay'])
}
