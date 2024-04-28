import { Player } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { emoji } from 'lib/Assets/emoji.js'

export class Cost {
  /**
   * Returns string representation of cost
   *
   * @returns {string}
   */
  string(canBuy = true) {
    return ''
  }

  /**
   * If the player have this cost returns true, otherwise false
   *
   * @param {Player} player
   * @returns {boolean}
   */
  check(player) {
    return false
  }

  /**
   * Removes this cost from player
   *
   * @param {Player} player
   */
  buy(player) {
    player.playSound(SOUNDS.action)
  }

  /**
   * Returns fail info for player
   *
   * @param {Player} player
   * @returns {string}
   */
  failed(player) {
    player.playSound(SOUNDS.fail)
    return 'Недостаточно средств'
  }
}

class ScoreboardCost extends Cost {
  constructor(cost = 1) {
    super()
    if (cost < 0) throw new TypeError(`Invalid ScoreboardCost: ${cost} < 0, positive number expected`)
    this.cost = cost
  }

  /** @type {import('@minecraft/server').ScoreName} */
  scoreboard = 'money'

  postfix = 'N'

  color = '§7'

  string(canBuy = true) {
    return `${canBuy ? this.color : '§c'}${this.cost}${this.postfix}`
  }

  /** @param {Player} player */
  check(player) {
    return player.scores[this.scoreboard] >= this.cost
  }

  /** @param {Player} player */
  buy(player) {
    player.scores[this.scoreboard] -= this.cost
    super.buy(player)
  }

  /** @param {Player} player */
  failed(player) {
    super.failed(player)
    const have = player.scores[this.scoreboard]
    return `§cНедостаточно средств (§4${have}/${this.cost}§c). Нужно еще ${this.color}${this.cost - have}`
  }
}

export class MoneyCost extends ScoreboardCost {
  /** @type {import('@minecraft/server').ScoreName} */
  scoreboard = 'money'

  postfix = emoji.money

  color = '§6'
}

export class LeafyCost extends ScoreboardCost {
  /** @type {import('@minecraft/server').ScoreName} */
  scoreboard = 'leafs'

  postfix = emoji.leaf

  color = '§a'
}

export class ItemCost extends Cost {}
