import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { stringifyError } from 'lib'
import { i18n } from 'lib/i18n/text'
import { selectByChance } from 'lib/rpg/random'

export class Ore {
  private types: string[] = []

  type(...typeIds: string[]) {
    this.types.push(...typeIds)
    return this
  }

  private deepslates: string[] = []

  deepslate(...typeIds: string[]) {
    for (const typeId of typeIds) {
      if (!typeId.includes('deepslate') && ![''].includes(typeId)) {
        console.warn(
          i18n.warn`Ore ${this.types.join(' ')} included a deeplsate typeid (${typeId}) that does not have deeplsate inside.\n${stringifyError.stack.get(1)}`,
        )
      }
    }

    this.deepslates.push(...typeIds)
    return this
  }
  private aboveY = -64

  private belowY = 200

  range(below: number, above: number) {
    this.belowY = below
    this.aboveY = above
    return this
  }

  private group = 0

  groupChance(chance: number) {
    this.group = chance
    return this
  }

  weight(weight: number) {
    return {
      weight,
      item: {
        weight,
        all: this.types.concat(this.deepslates),
        types: this.types,
        deepslates: this.deepslates,
        below: this.belowY,
        above: this.aboveY,
        groupChance: this.group,
      },
    }
  }
}

export type OreEntry = ReturnType<Ore['weight']>

export class OreCollector {
  private entries: OreEntry[]

  private readonly typeIds: string[]

  constructor(...entries: OreEntry[]) {
    this.entries = entries
    this.typeIds = entries.map(e => e.item.all).flat()
  }

  getAll() {
    return this.entries
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
    this.entries = this.entries.concat(new Ore().type('').deepslate('').weight(stoneChance))

    return this
  }

  selectOreByChance(deepslate = false, y: number): string {
    const ore = selectByChance(this.getAtY(y)).item
    const result = deepslate ? ore.deepslates[0] : ore.types[0]
    if (typeof result === 'undefined') throw new TypeError('No ore found!')

    return result
  }

  getAtY(y: number) {
    return this.entries.filter(e => y <= e.item.below && y >= e.item.above)
  }

  with(ore: OreEntry, chance = ore.weight) {
    return Object.setPrototypeOf(
      {
        entries: this.entries.concat({ weight: chance, item: { ...ore.item, weight: chance } }),
      },
      Object.getPrototypeOf(this) as this,
    ) as this
  }
}
