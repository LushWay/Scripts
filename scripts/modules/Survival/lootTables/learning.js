import { LootTable } from 'lib/Class/LootTable.js'

export const LEARNING_L = new LootTable(
  { key: 'starter' },
  {
    type: 'WoodenSword',
    chance: '100%',
    enchantments: {
      unbreaking: {
        '0...2': '50%',
        '3': '50%',
      },
    },
  },
  {
    type: 'LeatherBoots',
    chance: '80%',
  },
  {
    type: 'LeatherLeggings',
    chance: '100%',
    enchantments: {
      unbreaking: {
        '0...2': '50%',
        '3': '50%',
      },
    },
  },
  {
    type: 'LeatherChestplate',
    chance: '100%',
    enchantments: {
      unbreaking: {
        '0...2': '50%',
        '3': '50%',
      },
    },
  },
  {
    type: 'LeatherHelmet',
    chance: '80%',
  },
  {
    type: 'CookedBeef',
    chance: '100%',
    amount: {
      '10...30': '50%',
      '31...64': '10%',
    },
  }
)
