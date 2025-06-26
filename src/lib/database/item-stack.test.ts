import 'lib/extensions/enviroment'

import { ItemLoreSchema } from './item-stack'
import { defaultLang } from 'lib/assets/lang'

describe('item stack', () => {
  it('should create item', () => {
    const keyLore = new ItemLoreSchema('test')
      .property('key', String)

      .property('owner', String)
      .display('Владелец')

      .property('owned', Boolean)
      .display('Занято')

      .property('someOptionalWithDefault', 3000)
      .display('Отображение опции')

      .build()

    const { item, storage } = keyLore.create(defaultLang, {
      key: 'defaultkey',
      owner: 'Имя',
      owned: true,
    })

    expect(storage).toEqual({ key: 'defaultkey', owner: 'Имя', owned: true, someOptionalWithDefault: 3000 })
    expect(item.getLore()).toMatchInlineSnapshot(`
      [
        "§r§f§7Владелец: §fИмя",
        "§r§f§7Занято: §fДа",
        "§r§6§7Отображение опции: §63.000",
      ]
    `)

    if (!storage) throw new TypeError('Storage is empty!')

    storage.key = 'key'
    storage.owner = 'owner'

    expect(storage).toEqual({ key: 'key', owner: 'owner', owned: true, someOptionalWithDefault: 3000 })
    expect(item.getLore()).toMatchInlineSnapshot(`
      [
        "§r§f§7Владелец: §fowner",
        "§r§f§7Занято: §fДа",
        "§r§6§7Отображение опции: §63.000",
      ]
    `)
  })

  it('should create item with array property', () => {
    const key = new ItemLoreSchema('test 2').property('keys', [String]).display('Ключи').build()

    const { item, storage } = key.create(defaultLang, { keys: ['string', 'string2'] })
    if (!storage) throw new TypeError('Storage is empty!')

    expectTypeOf(storage.keys).toBeArray()
    expect(storage.keys).toEqual(['string', 'string2'])
    expect(item.getLore()).toMatchInlineSnapshot(`
      [
        "§r§7§7Ключи: [
        §2\`string\`§r,
        §2\`string",
        "§r§r2\`§r
      ]",
      ]
    `)
  })
})
