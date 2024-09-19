import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { TEST_createPlayer, TEST_onFormOpen } from 'test/utils'
import { describe, it } from 'vitest'
import { Shop } from '../shop'

import 'lib/database/scoreboard'

describe('sellableItem', () => {
  it('should sell items', () => {
    const player = TEST_createPlayer()
    const shop = new Shop('shop', 'id')

    return // Skipped

    shop.menu(form => {
      form.dynamicCostItem(MinecraftItemTypes.ArmadilloSpawnEgg, { defaultCount: 0, k: 1, maxCount: 10, minPrice: 1 })
    })
    console.log({ s: player.scores })
    TEST_onFormOpen(player, 'action', form => {
      console.log(form)
      TEST_onFormOpen(player, 'action', form => {
        console.log(form)
        TEST_onFormOpen(player, 'message', form => {
          console.log(form)
          return 0
        })
        return 1
      })
      return 0
    })
    shop.open(player)
  })
})
