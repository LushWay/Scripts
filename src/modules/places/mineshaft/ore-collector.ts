import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { selectByChance, stringifyError } from 'lib'
import { t } from 'lib/text'

export class Ore {
  private types: string[] = []

  type(typeId: string) {
    this.types.push(typeId)
    return this
  }

  private deepslates: string[] = []

  deepslate(typeId: string) {
    if (!typeId.includes('deepslate') && ![''].includes(typeId)) {
      console.warn(
        t.warn`Ore ${this.types.join(' ')} included a deeplsate typeid (${typeId}) that does not have deeplsate inside.\n${stringifyError.stack.get(1)}`,
      )
    }

    this.deepslates.push(typeId)
    return this
  }

  private belowY = 200

  /** Restricts ore spawning to only below this y-point */
  below(y: number) {
    this.belowY = y
    return this
  }

  private group = 0

  groupChance(chance: number) {
    this.group = chance
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
        below: this.belowY,
        groupChance: this.group,
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

  selectOreByChance(deepslate = false, y: number) {
    const ore = selectByChance(this.entries.filter(e => y <= e.item.below)).item
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
