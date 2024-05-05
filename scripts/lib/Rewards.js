import { ItemStack, Player } from '@minecraft/server'
import { emoji } from 'lib/Assets/emoji.js'

/**
 * @typedef {{
 *   type: 'scores' | 'item'
 *   count: number
 *   id?: string
 *   name?: string
 *   score?: import('@minecraft/server').ScoreName
 * }} Reward
 */
export class Rewards {
  /**
   * Restores the object from an array
   *
   * @param {Reward[]} entries The array of reward entries
   * @returns {Rewards}
   */
  static restore(entries) {
    const rewards = new Rewards()
    rewards.entries = entries

    return rewards
  }

  /**
   * @private
   * @type {Reward[]}
   */
  entries = []

  /**
   * Adds a reward entry of leaves or money
   *
   * @param {import('@minecraft/server').ScoreName} type The reward type
   * @param {number} count The reward amount
   * @returns {Rewards}
   */
  scores(type, count) {
    this.entries.push({ type: 'scores', count, score: type })
    return this
  }

  /**
   * Adds a reward entry of items
   *
   * @param {string} id The item ID
   * @param {string} name The item name
   * @param {number} count The item count
   * @returns {Rewards}
   */
  item(id, name, count) {
    this.entries.push({ type: 'item', id, name, count })
    return this
  }

  /**
   * Gives a reward to the player
   *
   * @private
   * @param {Player} player The player to give out the rewards to
   * @param {Reward} reward
   */
  static giveOne(player, reward) {
    if (reward.type == 'item' && reward.id) {
      if (!player.container) return
      player.container.addItem(new ItemStack(reward.id, reward.count))
    } else if (reward.type == 'scores') {
      if (!reward.score) return
      player.scores[reward.score] += reward.count
    }
  }

  /**
   * Gives out the rewards to a player
   *
   * @param {Player} player The player to give out the rewards to
   * @returns {Rewards}
   */
  give(player) {
    for (const reward of this.entries) Rewards.giveOne(player, reward)
    player.sendMessage('§l§eВы получили награды!')
    return this
  }

  /**
   * Serializes the object into an array
   *
   * @returns {Reward[]} The array of rewards
   */
  serialize() {
    return this.entries
  }

  /**
   * Returns the rewards as a human-readable string
   *
   * @returns {string}
   */
  toString() {
    const rewardsAsStrings = []
    for (const reward of this.entries) {
      if (reward.type == 'scores' && reward.score == 'leafs')
        rewardsAsStrings.push(`${emoji.leaf} Листья x ${reward.count}`)
      else if (reward.type == 'scores' && reward.score == 'money')
        rewardsAsStrings.push(`${emoji.money} Монеты x ${reward.count}`)
      else if (reward.type == 'item') rewardsAsStrings.push(`${reward.name ?? 'Яблоко'} x ${reward.count}`)
      else rewardsAsStrings.push(`${reward.score} x ${reward.count}`)
    }
    return rewardsAsStrings.join('\n')
  }
}
