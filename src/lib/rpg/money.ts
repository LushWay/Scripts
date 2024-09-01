import { Player, world } from '@minecraft/server'
import { Items } from 'lib/assets/custom-items'
import { Sounds as CustomSounds } from 'lib/assets/custom-sounds'
import { emoji } from 'lib/assets/emoji'
import { Cooldown } from 'lib/cooldown'
import { ms } from 'lib/utils/ms'

const cooldown = new Cooldown(ms.from('sec', 1), false)
world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId === Items.Money && cooldown.isExpired(event.source)) {
    givePlayerMoneyAndXp(event.source, event.itemStack.amount)
    event.source.mainhand().setItem(undefined)
  }
})

export function givePlayerMoneyAndXp(player: Player, amount: number, xp?: number) {
  player.scores.money += amount
  player.tell(`§6+${amount}${emoji.money}${xp ? ` §a+${xp}lvl` : ''}`)
  if (xp) player.addLevels(xp)
  player.playSound(CustomSounds.Pay)
}
