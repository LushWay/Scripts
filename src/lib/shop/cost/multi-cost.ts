import { Player } from '@minecraft/server'
import { i18n } from 'lib/i18n/text'
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

  toString(player: Player, canBuy = true): string {
    return this.costs
      .map(cost => cost.toString(player, canBuy ? true : cost.has(player)))
      .filter(e => !!e)
      .join(', ')
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

  failed(player: Player): string {
    super.failed(player)
    let messages = ''
    for (const cost of this.costs) {
      const canBuy = cost.has(player)
      if (!canBuy) {
        const failed = cost.failed(player)
        if (failed === '') continue

        messages += failed
      }
    }

    return messages || i18n.error`Недостаточно средств.`.toString(player.lang)
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
