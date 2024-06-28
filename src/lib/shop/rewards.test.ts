import { describe, expect, it } from 'vitest'
import { itemDescription } from './rewards'

describe('itemDescription', () => {
  it('should create description without amount', () => {
    expect(
      itemDescription({
        typeId: 'minecraft:apple',
        amount: 0,
      }),
    ).toMatchInlineSnapshot(`
      {
        "rawtext": [
          {
            "text": "§7",
          },
          {
            "translate": "item.apple.name",
          },
        ],
      }
    `)
  })
  it('should create description', () => {
    expect(
      itemDescription({
        typeId: 'minecraft:apple',
        nameTag: 'name tag',
        amount: 20,
      }),
    ).toMatchInlineSnapshot(`
      {
        "rawtext": [
          {
            "text": "§7",
          },
          {
            "text": "name tag",
          },
          {
            "text": " §r§f§7x20",
          },
        ],
      }
    `)
  })
})
