import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { selectByChance } from 'lib'

const types = Symbol('ore.types')
const deepslates = Symbol('ore.deepslate')
const all = Symbol('ore.all')
const chance = Symbol('ore.chance')

export class Ore {
  [types]: string[] = []

  type(typeId: string) {
    this[types].push(typeId)
    return this
  }

  [deepslates]: string[] = []

  deepslate(typeId: string) {
    this[deepslates].push(typeId)
    return this
  }

  [all]: string[] = [];

  [chance] = 1

  chance(count: number) {
    this[chance] = count
    return this
  }
}

export class OreCollector {
  private readonly entries: Ore[]

  private readonly typeIds: string[]

  constructor(...entries: Ore[]) {
    this.entries = entries
    this.entries.forEach(e => (e[all] = e[types].concat(e[deepslates])))
    this.typeIds = entries.map(e => e[all]).flat()
  }

  getOre(typeId: string) {
    if (!this.typeIds.includes(typeId)) return

    for (const ore of this.entries) {
      if (ore[all].includes(typeId)) {
        return {
          ore,
          isDeepslate: ore[deepslates].includes(typeId),
          get stone() {
            return this.isDeepslate ? b.Deepslate : b.Stone
          },
        }
      }
    }
  }

  stoneChance(stoneChance: number) {
    this.chances = this.entries
      .map(e => ({ chance: e[chance], item: e }))
      .concat({ chance: stoneChance, item: new Ore().type('').deepslate('') })

    return this
  }

  private chances: { chance: number; item: Ore }[] = []

  selectOreByChance(deepslate = false) {
    const ore = selectByChance(this.chances).item
    return deepslate ? ore[deepslates][0] : ore[types][0]
  }
}
