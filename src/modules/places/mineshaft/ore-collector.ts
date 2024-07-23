import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { selectByChance } from 'lib'

export class Ore {
  private types: string[] = []

  type(typeId: string) {
    this.types.push(typeId)
    return this
  }

  private deepslates: string[] = []

  deepslate(typeId: string) {
    this.deepslates.push(typeId)
    return this
  }

  chance(chance: number) {
    return {
      chance,
      item: {
        chance,
        all: this.types.concat(this.deepslates),
        types: this.types,
        deepslates: this.deepslates,
      },
    }
  }
}

export type OreEntry = ReturnType<Ore['chance']>

export class OreCollector {
  private entries: OreEntry[]

  private readonly typeIds: string[]

  constructor(...entries: OreEntry[]) {
    this.entries = entries
    this.typeIds = entries.map(e => e.item.all).flat()
  }

  isOre(typeId: string) {
    return this.typeIds.includes(typeId)
  }

  getOre(typeId: string) {
    if (!this.isOre(typeId)) return

    for (const ore of this.entries) {
      if (ore.item.all.includes(typeId)) {
        const isDeepslate = ore.item.deepslates.includes(typeId)
        const empty = isDeepslate ? b.Deepslate : b.Stone
        return { ore, isDeepslate, empty }
      }
    }
  }

  stoneChance(stoneChance: number) {
    this.entries = this.entries.concat(new Ore().type('').deepslate('').chance(stoneChance))

    return this
  }

  selectOreByChance(deepslate = false) {
    const ore = selectByChance(this.entries).item
    return deepslate ? ore.deepslates[0] : ore.types[0]
  }

  with(ore: OreEntry, chance = ore.chance) {
    return Object.setPrototypeOf(
      {
        entries: this.entries.concat({ chance, item: { ...ore.item, chance } }),
      },
      Object.getPrototypeOf(this) as this,
    ) as this
  }
}
