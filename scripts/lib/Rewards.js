import { ItemStack, Player } from '@minecraft/server'

/** @typedef {{ type: ('scores'|'item'), count: number, id?: string, score?: import('@minecraft/server').ScoreName }} Reward */
export class Rewards {
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
   * @param {number} count The item count
   * @returns {Rewards}
   */
  item(id, count) {
    this.entries.push({ type: 'item', id, count })
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
    } else if(reward.type == 'scores') {
      if(!reward.score) return
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
    for(let reward of this.entries)
      Rewards.giveOne(player, reward)
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
   * Restores the object from an array
   * 
   * @param {Reward[]} rewards The array of rewards
   * @returns {Rewards}
   */
  restore(rewards) {
    this.entries = rewards
    return this
  }
}