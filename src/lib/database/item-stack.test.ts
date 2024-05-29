import 'lib/extensions/enviroment'

import { describe, expect, expectTypeOf, it } from 'vitest'
import { ItemLoreSchema } from './item-stack'

describe('item stack', () => {
  it('should create item', () => {
    const keyLore = new ItemLoreSchema()
      .property('key', String)

      .property('owner', String)
      .display('Владелец')

      .property('owned', Boolean)
      .display('Занято')

      .property('someOptionalWithDefault', 3000) // 3 is default value
      .display('Отображение опции')

      .build()

    const { item, storage } = keyLore.create({
      key: 'defaultkey',
      owner: 'Имя',
      owned: true,
      // someOptionalWithDefault is not required
    })

    expect(item.getLore()).toMatchInlineSnapshot(`
      [
        "§7Владелец: §fИмя",
        "§7Занято: §fДа",
        "§7Отображение опции: §63000§r",
      ]
    `)

    storage.key = 'key'
    storage.owner = 'owner'

    expect(storage).toEqual({ key: 'key', owner: 'owner', owned: true, someOptionalWithDefault: 3000 })
    expect(item.getLore()).toMatchInlineSnapshot(`
      [
        "§7Владелец: §fowner",
        "§7Занято: §fДа",
        "§7Отображение опции: §63000§r",
      ]
    `)
  })

  it('should create item with array property', () => {
    const key = new ItemLoreSchema().property('keys', [String]).display('Ключи').build()

    const { item, storage } = key.create({ keys: ['string', 'string2'] })
    expectTypeOf(storage.keys).toBeArray()
    expect(storage.keys).toEqual(['string', 'string2'])
    expect(item.getLore()).toMatchInlineSnapshot(`
      [
        "§7Ключи: [
        §2\`string\`§r,
        §2\`string2\`§r
      ]",
      ]
    `)
  })
})
