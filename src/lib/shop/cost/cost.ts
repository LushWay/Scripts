import { Player } from '@minecraft/server'
import { Sounds } from 'lib/assets/config'
import { MaybeRawText, t } from 'lib/text'

export enum CostType {
  /** Cost with this type removes item from inv, changes score etc */
  Action,

  /** Cost with this type ONLY checks if player can afford this cost */
  Requirement,
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export abstract class Cost<T = unknown> {
  get type(): CostType {
    return CostType.Action
  }

  /**
   * Returns string representation of cost
   *
   * @param canBuy - Whenether to display this cost as affordable by player or not
   * @param player - Player to check cost on. Used in MultipleCost to check each one manually
   */
  abstract toString(canBuy?: boolean, player?: Player): MaybeRawText

  /**
   * If the player have this cost value returns true, otherwise false
   *
   * @param player - Player to check on
   */
  abstract has(player: Player): boolean

  /**
   * Removes this cost from player
   *
   * @param player - Buyer
   */
  buy(player: Player): T {
    player.playSound(Sounds.Action)
    return undefined as T
  }

  /**
   * Returns fail info for player
   *
   * @param player - Player to play sound on
   */
  failed(player: Player): MaybeRawText {
    player.playSound(Sounds.Fail)
    return ''
  }
}

export const TooMuchItems = ErrorCost(t.error`Склад переполнен`)
export const NoItemsToSell = ErrorCost(t.error`Товар закончился`)
export const FreeCost: Cost = new (class extends Cost {
  get type(): CostType {
    return CostType.Requirement
  }

  toString(): MaybeRawText {
    return ''
  }

  has() {
    return true
  }
})()

function ErrorCost(message: MaybeRawText): Cost {
  return new (class extends Cost {
    get type(): CostType {
      return CostType.Requirement
    }

    toString(): MaybeRawText {
      return message
    }

    has() {
      return false
    }

    failed(player: Player) {
      super.failed(player)
      return this.toString()
    }
  })()
}
