import { ItemStack, Player, RawMessage, ScoreName } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { emoji } from 'lib/assets/emoji'
import { noBoolean } from 'lib/util'
import { langToken } from 'lib/utils/lang'

export  namespace Rewards {
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
        name: string
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
  item(id: MinecraftItemTypes | string, name: string, count: number): Rewards {
    this.entries.push({ type: 'item', id, name, count })
    return this
  }

  /**
   * Removes a reward
   *
   * @param {Rewards.DatabaseEntry} reward The reward to remove
   */
  remove(reward: Rewards.DatabaseEntry) {
    this.entries = this.entries.filter(entry => entry != reward)
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
      player.container.addItem(new ItemStack(reward.id, reward.count))
    } else if (reward.type === 'scores') {
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
   * @returns {Rewards.DatabaseEntry[]} The array of rewards
   */
  serialize(): Rewards.DatabaseEntry[] {
    return this.entries
  }

  /**
   * Returns a single reward as a human-readable string
   *
   * @param reward The reward to stringify
   */
  static rewardToString(this: void, reward: Rewards.DatabaseEntry): RawMessage {
    let text: string | RawMessage
    if (reward.type === 'scores') {
      if (reward.score === 'leafs') text = `${reward.count}${emoji.leaf}`
      else if (reward.score === 'money') text = `${reward.count}${emoji.money}`
      else text = `${reward.score} x${reward.count}`
    } else if ((reward.type as string) === 'item')
      text = itemDescription({ nameTag: reward.name, amount: reward.count, typeId: reward.id })
    else text = 'Неизвестная награда...'

    return typeof text === 'string' ? { text } : text
  }

  /** Returns the rewards as a human-readable string */
  toString(): RawMessage {
    return { rawtext: this.entries.map(Rewards.rewardToString) }
  }
}

/**
 * Returns <item name>\nx<count>
 *
 * @param {ItemStack} item
 */
export function itemDescription(
  item: Pick<ItemStack, 'typeId' | 'nameTag' | 'amount'>,
  c = '§7',
  amount = true,
): RawMessage {
  return {
    rawtext: [
      c ? { text: c } : false,
      item.nameTag
        ? { text: (c ? uncolor(item.nameTag) : item.nameTag).replace(/\n.*/, '') }
        : { translate: langToken(item) },
      amount && item.amount ? { text: ` §r§f${c}x${item.amount}` } : false,
    ].filter(noBoolean),
  }
}

function uncolor(t: string) {
  return t.replaceAll(/§./g, '')
}

