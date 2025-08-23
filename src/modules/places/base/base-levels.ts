import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Cost, FreeCost, MultiCost } from 'lib/shop/cost'

interface BaseLevel {
  radius: number
  cost: Cost
}

export const baseLevels: BaseLevel[] = [
  { radius: 0, cost: FreeCost },
  { radius: 10, cost: FreeCost },
  { radius: 15, cost: new MultiCost().money(1000) },
  { radius: 30, cost: new MultiCost().money(10000).item(MinecraftItemTypes.NetherStar) },
]
