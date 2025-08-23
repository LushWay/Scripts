import { TEST_createPlayer } from 'test/utils'
import { itemNameXCount } from './item-name-x-count'

describe('itemDescription', () => {
  it('should create description without amount', () => {
    const player = TEST_createPlayer()

    expect(
      itemNameXCount(
        {
          typeId: 'minecraft:apple',
          amount: 0,
        },
        undefined,
        undefined,
        player,
      ),
    ).toMatchInlineSnapshot(`"§7Яблоко"`)
  })
  it('should create description', () => {
    const player = TEST_createPlayer()
    expect(
      itemNameXCount(
        {
          typeId: 'minecraft:apple',
          nameTag: 'name tag',
          amount: 20,
        },
        undefined,
        undefined,
        player,
      ),
    ).toMatchInlineSnapshot(`"§7name tag §r§f§7x20"`)
  })
})
