import { Player } from '@minecraft/server'
import { SOUNDS } from 'lib/assets/config'
import { emoji } from 'lib/assets/emoji'

export class Cost {
  /**
   * Returns string representation of cost
   *
   * @returns {string}
   */
  string(canBuy = true): string {
    return ''
  }

  /**
   * If the player have this cost returns true, otherwise false
   *
   * @param {Player} player
   * @returns {boolean}
   */

  check(player: Player): boolean {
    return false
  }

  /**
   * Removes this cost from player
   *
   * @param {Player} player
   */

  buy(player: Player) {
    player.playSound(SOUNDS.action)
  }

  /**
   * Returns fail info for player
   *
   * @param {Player} player
   * @returns {string}
   */

  failed(player: Player): string {
    player.playSound(SOUNDS.fail)
    return 'Недостаточно средств'
  }
}

class ScoreboardCost extends Cost {
  cost

  constructor(cost = 1) {
    super()
    if (cost < 0) throw new TypeError(`Invalid ScoreboardCost: ${cost} < 0, positive number expected`)
    this.cost = cost
  }

  scoreboard: import('@minecraft/server').ScoreName = 'money'

  postfix = 'N'

  color = '§7'

  string(canBuy = true) {
    return `${canBuy ? this.color : '§c'}${this.cost}${this.postfix}`
  }

  check(player: Player) {
    return player.scores[this.scoreboard] >= this.cost
  }

  buy(player: Player) {
    player.scores[this.scoreboard] -= this.cost
    super.buy(player)
  }

  failed(player: Player) {
    super.failed(player)
    const have = player.scores[this.scoreboard]
    return `§cНедостаточно средств (§4${have}/${this.cost}§c). Нужно еще ${this.color}${this.cost - have}`
  }
}

export class MoneyCost extends ScoreboardCost {
  scoreboard: import('@minecraft/server').ScoreName = 'money'

  postfix = emoji.money

  color = '§6'
}

export class LeafyCost extends ScoreboardCost {
  scoreboard: import('@minecraft/server').ScoreName = 'leafs'

  postfix = emoji.leaf

  color = '§a'
}

export class ItemCost extends Cost {}
