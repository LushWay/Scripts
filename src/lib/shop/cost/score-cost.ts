import { Player } from '@minecraft/server'
import { separateNumberWithDots } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { t } from 'lib/text'
import { Cost } from '../cost'

export class ScoreboardCost extends Cost {
  cost

  constructor(cost = 1) {
    super()
    if (cost < 0) throw new TypeError(`Invalid ScoreboardCost: ${cost} < 0, positive number expected`)
    this.cost = cost
  }

  scoreboard: import('@minecraft/server').ScoreName = 'money'

  emoji = 'N'

  color = '§7'

  toString(canBuy = true) {
    return `${canBuy ? this.color : '§c'}${separateNumberWithDots(this.cost)}${this.emoji}`
  }

  has(player: Player) {
    return player.scores[this.scoreboard] >= this.cost
  }

  buy(player: Player) {
    player.scores[this.scoreboard] -= this.cost
    super.buy(player)
  }

  failed(player: Player) {
    super.failed(player)
    const have = player.scores[this.scoreboard]
    return t.error`${have}/${this.cost}${this.emoji}`
  }
}

export class MoneyCost extends ScoreboardCost {
  scoreboard: import('@minecraft/server').ScoreName = 'money'

  emoji = emoji.money

  color = '§6'
}

export class LeafyCost extends ScoreboardCost {
  scoreboard: import('@minecraft/server').ScoreName = 'leafs'

  emoji = emoji.leaf

  color = '§a'
}
