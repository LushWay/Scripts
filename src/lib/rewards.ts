import { ItemStack, Player, ScoreName } from '@minecraft/server'
import { emoji } from 'lib/assets/emoji'
import { itemLocaleName } from './game-utils'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'

export type Reward =
  | {
      type: 'scores'
      count: number

      score: import('@minecraft/server').ScoreName
    }
  | {
      type: 'item'
      count: number
      id: string
      name: string
    }

export class Rewards {
  /**
   * Restores the object from an array
   *
   * @param entries The array of reward entries
   * @returns {Rewards}
   */
  static restore(entries: Reward[]): Rewards {
    const rewards = new Rewards()
    rewards.entries = entries

    return rewards
  }

  private entries: Reward[] = []

  scores(type: ScoreName, count: number) {
    this.entries.push({ type: 'scores', count, score: type })
    return this
  }

  /**
   * Adds a reward entry of items
   *
   * @param id The item ID
   * @param name The item name
   * @param count The item count
   */
  item(id: MinecraftItemTypes | string, name: string, count: number): Rewards {
    this.entries.push({ type: 'item', id, name, count })
    return this
  }

  /**
   * Gives a reward to the player
   *
   * @param player - The player to give out the rewards to
   * @param reward - The Reward to give
   */
  private static giveOne(player: Player, reward: Reward) {
    if (reward.type === 'item' && reward.id) {
      if (!player.container) return
      player.container.addItem(new ItemStack(reward.id, reward.count))
    } else if (reward.type === 'scores') {
      if (!reward.score) return
      player.scores[reward.score] += reward.count
    }
  }

  /**
   * Gives out the rewards to a player
   *
   * @param player The player to give out the rewards to
   */
  give(player: Player): Rewards {
    for (const reward of this.entries) Rewards.giveOne(player, reward)
    player.success('Вы получили награды!')
    return this
  }

  /**
   * Serializes the object into an array
   *
   * @returns {Reward[]} The array of rewards
   */
  serialize(): Reward[] {
    return this.entries
  }

  /**
   * Returns the rewards as a human-readable string
   *
   * @returns {string}
   */
  toString(): string {
    const rewardsAsStrings = []
    for (const reward of this.entries) {
      if (reward.type == 'scores' && reward.score == 'leafs')
        rewardsAsStrings.push(`${emoji.leaf} Листья x ${reward.count}`)
      else if (reward.type === 'scores' && reward.score == 'money')
        rewardsAsStrings.push(`${emoji.money} Монеты x ${reward.count}`)
      else if (reward.type === 'item')
        rewardsAsStrings.push(itemDescription({ nameTag: reward.name, amount: reward.count, typeId: reward.id }))
      else rewardsAsStrings.push(`${reward.score} x ${reward.count}`)
    }
    return rewardsAsStrings.join('\n')
  }
}

/**
 * Returns <item name>\nx<count>
 *
 * @param {ItemStack} item
 */

export function itemDescription(item: Pick<ItemStack, 'typeId' | 'nameTag' | 'amount'>, c = '§g', newline = false) {
  return `${item.nameTag ?? itemLocaleName(item)}§r${newline ? '\n' : ''}${item.amount ? `${newline ? '' : ' '}${c}x${item.amount}${newline ? ' ' : ''}` : ''}`
}
