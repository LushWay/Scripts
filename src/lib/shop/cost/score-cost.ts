import { Player } from '@minecraft/server'
import { emoji } from 'lib/assets/emoji'
import { noI18n } from 'lib/i18n/text'
import { separateNumberWithDots } from 'lib/util'
import { Cost } from '../cost'

export abstract class ScoreboardCost extends Cost {
  cost

  constructor(cost = 1) {
    super()
    if (cost < 0) throw new TypeError(`Invalid ScoreboardCost: §f${cost}§c < 0, positive number expected`)
    this.cost = cost
  }

  abstract scoreboard: import('@minecraft/server').ScoreName

  emoji = 'N'

  color = '§7'

  toString(_: Player, canBuy = true) {
    return `${canBuy ? this.color : '§c'}${separateNumberWithDots(this.cost)}${this.emoji}`
  }

  has(player: Player) {
    return player.scores[this.scoreboard] >= this.cost
  }

  take(player: Player) {
    player.scores[this.scoreboard] -= this.cost
    super.take(player)
  }

  failed(player: Player) {
    super.failed(player)
    const have = player.scores[this.scoreboard]
    return noI18n`${have}/${this.cost}${this.emoji}`
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
