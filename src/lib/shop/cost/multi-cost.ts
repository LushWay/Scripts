import { Player, RawText } from '@minecraft/server'
import { MaybeRawText, t } from 'lib/text'
import { noBoolean } from 'lib/util'
import { Cost, ItemCost, LeafyCost, MoneyCost, ScoreboardCost } from '../cost'
import { CostType } from './cost'
import { XPCost } from './xp'

/** Class used co combine multiple Costs */
export class MultiCost<T extends Cost[]> extends Cost {
  private costs: T

  constructor(...costs: T) {
    super()
    this.costs = costs
  }

  get type(): CostType {
    return this.costs.every(e => e.type === CostType.Requirement) ? CostType.Requirement : CostType.Action
  }

  get multiline(): boolean {
    return this.costs.length > 1 || this.costs.some(e => e.multiline)
  }

  toString(canBuy = true, player?: Player): RawText {
    return {
      rawtext: this.costs
        .map(cost => cost.toString(!canBuy && player ? cost.has(player) : canBuy, player))
        .map((string, i, arr) => {
          if (string === '') return false
          if (arr.length !== 0 && arr[i - 1]) return t.raw`, ${string}`
          else return t.raw`${string}`
        })
        .filter(noBoolean),
    }
  }

  has(player: Player): boolean {
    return this.costs.every(e => e.has(player))
  }

  take(player: Player) {
    super.take(player)
    return this.costs.map(e => e.take(player)) as {
      -readonly [P in keyof T]: T[P] extends Cost<infer R> ? R : never
    }
  }

  failed(player: Player): MaybeRawText {
    super.failed(player)
    let messages: RawText | undefined
    for (const cost of this.costs) {
      const canBuy = cost.has(player)
      if (!canBuy) {
        const failed = cost.failed(player)
        if (failed === '') continue

        if (messages) {
          messages = t.raw`${messages}\n${failed}`
        } else messages = t.raw`${failed}`
      }
    }

    return messages ?? t.raw`Недостаточно средств.`
  }

  item = this.createCostAlias(ItemCost)

  money = this.createCostAlias(MoneyCost)

  leafy = this.createCostAlias(LeafyCost)

  xp = this.createCostAlias(XPCost)

  private createCostAlias<T extends typeof ItemCost | typeof ScoreboardCost | typeof XPCost>(target: T) {
    return (...args: ConstructorParameters<T>) => {
      this.costs.push(new (target as unknown as new (...args: ConstructorParameters<T>) => Cost)(...args))
      return this
    }
  }
}
