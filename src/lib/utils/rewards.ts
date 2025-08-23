import { ItemStack, Player, ScoreName } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { emoji } from 'lib/assets/emoji'
import { i18n, noI18n } from 'lib/i18n/text'
import { itemNameXCount } from './item-name-x-count'

export namespace Rewards {
  export type DatabaseEntry =
    | {
        type: 'scores'
        count: number
        score: import('@minecraft/server').ScoreName
      }
    | {
        type: 'item'
        count: number
        id: string
        name?: Text
      }
}

export class Rewards {
  /**
   * Restores the object from an array
   *
   * @param entries The array of reward entries
   * @returns {Rewards}
   */
  static restore(entries: Rewards.DatabaseEntry[]): Rewards {
    const rewards = new Rewards()
    rewards.entries = entries

    return rewards
  }

  private entries: Rewards.DatabaseEntry[] = []

  money(count: number) {
    return this.score('money', count)
  }

  score(type: ScoreName, count: number) {
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
  item(id: MinecraftItemTypes | string, count: number, name?: Text): Rewards {
    this.entries.push({ type: 'item', id, name, count })
    return this
  }

  /**
   * Removes a reward
   *
   * @param {Rewards.DatabaseEntry} reward The reward to remove
   */
  remove(reward: Rewards.DatabaseEntry) {
    this.entries = this.entries.filter(entry => entry !== reward)
  }

  /**
   * Gives a reward to the player
   *
   * @param player - The player to give out the rewards to
   * @param reward - The Reward to give
   */
  private static giveOne(player: Player, reward: Rewards.DatabaseEntry) {
    if (reward.type === 'item' && reward.id) {
      if (!player.container) return
      const item = new ItemStack(reward.id, reward.count)
      if (reward.name) item.nameTag = reward.name.to(player.lang)
      player.container.addItem(item)
    } else if (reward.type === 'scores') {
      player.scores[reward.score] += reward.count
    }
  }

  /**
   * Gives out the rewards to a player
   *
   * @param player The player to give out the rewards to
   */
  give(player: Player, tell = true): Rewards {
    for (const reward of this.entries) Rewards.giveOne(player, reward)
    if (tell) player.success(i18n`Вы получили награды!`)
    return this
  }

  /**
   * Serializes the object into an array
   *
   * The array of rewards
   */
  serialize(): Rewards.DatabaseEntry[] {
    return this.entries
  }

  /**
   * Returns a single reward as a human-readable string
   *
   * @param reward The reward to stringify
   */
  static rewardToString(this: void, reward: Rewards.DatabaseEntry, player: Player): string {
    let text: string
    if (reward.type === 'scores') {
      if (reward.score === 'leafs') text = `${reward.count}${emoji.leaf}`
      else if (reward.score === 'money') text = `${reward.count}${emoji.money}`
      else text = `${reward.score} x${reward.count}`
    } else if ((reward.type as string) === 'item')
      text = itemNameXCount(
        { nameTag: reward.name?.to(player.lang), amount: reward.count, typeId: reward.id },
        undefined,
        undefined,
        player,
      )
    else text = noI18n`Unknown reward ${reward.type}`

    return text
  }

  /** Returns the rewards as a human-readable string */
  toString(player: Player): string {
    return this.entries.map(e => Rewards.rewardToString(e, player)).join(', ')
  }
}
