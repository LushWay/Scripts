import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import 'lib/extensions/enviroment'
import { beforeEach, describe, expect, it } from 'vitest'
import { Loot, LootTable } from './loot-table'

describe('loot table', () => {
  beforeEach(() => {
    LootTable.instances = {}
  })

  it('should generate 100% items', () => {
    const lootTable = new Loot('test').item('AcaciaBoat').chance('100%').build

    expect(!!lootTable.generate(10).find(e => e?.typeId === MinecraftItemTypes.AcaciaBoat)).toBe(true)
  })

  it('should generate all 100% items', () => {
    const lootTable = new Loot('test')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat').build

    expect(lootTable.generate(10).filter(e => e?.typeId === MinecraftItemTypes.AcaciaBoat).length).toBe(5)
  })

  it('should generate all 100% items even with little size', () => {
    const lootTable = new Loot('test')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat').build

    expect(lootTable.generate(5).filter(e => e?.typeId === MinecraftItemTypes.AcaciaBoat).length).toBe(5)
  })

  it('should generate one item', () => {
    const lootTable = new Loot('test')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat').build

    expect(lootTable.generateOne().typeId).toBe(MinecraftItemTypes.AcaciaBoat)
  })
})
