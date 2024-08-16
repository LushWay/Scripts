import { Player, RawText } from '@minecraft/server'
import { noBoolean } from 'lib'
import { MaybeRawText, t } from 'lib/text'
import { Cost, ItemCost, LeafyCost, MoneyCost, ScoreboardCost } from '../cost'
import { CostType } from './cost'

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

  toString(canBuy = true, player?: Player): RawText {
    return {
      rawtext: this.costs
        .map((cost, i, arr) => {
          const string = cost.toString(!canBuy && player ? cost.has(player) : canBuy, player)
          if (string === '') return false

          if (arr.length - 1 === i) return t.raw`${string}`
          else return t.raw`${string}, `
        })
        .filter(noBoolean),
    }
  }

  has(player: Player): boolean {
    return this.costs.every(e => e.has(player))
  }

  buy(player: Player) {
    super.buy(player)
    return this.costs.map(e => e.buy(player)) as {
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

  private createCostAlias<T extends typeof ItemCost | typeof ScoreboardCost>(target: T) {
    return (...args: ConstructorParameters<T>) => {
      this.costs.push(
        // @ts-expect-error Idk why it complains
        new target(...args),
      )
      return this
    }
  }
}
