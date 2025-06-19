import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import 'lib/extensions/enviroment'
import { Loot } from './loot-table'

describe('loot table', () => {
  it('should generate 100% items', () => {
    const lootTable = new Loot('test').item('AcaciaBoat').weight('100%').build

    expect(!!lootTable.generate(10).find(e => e?.typeId === MinecraftItemTypes.AcaciaBoat)).toBe(true)
  })

  it('should generate all 100% items', () => {
    const lootTable = new Loot()
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat').build

    expect(lootTable.generate(10).filter(e => e?.typeId === MinecraftItemTypes.AcaciaBoat).length).toBe(5)
  })

  it('should generate all 100% items even with little size', () => {
    const lootTable = new Loot()
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat').build

    expect(lootTable.generate(5).filter(e => e?.typeId === MinecraftItemTypes.AcaciaBoat).length).toBe(5)
  })

  it('should generate one item', () => {
    const lootTable = new Loot()
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat')
      .item('AcaciaBoat').build

    expect(lootTable.generateOne().typeId).toBe(MinecraftItemTypes.AcaciaBoat)
  })
})

describe('loot table random cost', () => {
  it('should create random cost', () => {
    expect(
      Loot.randomCostToArray({
        '1...3': '10%',
        '4...5': '20%',
      }),
    ).toMatchInlineSnapshot(`
      [
        1,
        2,
        3,
        4,
        4,
        5,
        5,
      ]
    `)
  })
})
