import { system } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, util } from 'lib'
import { ChestLoot } from 'lib/chest-loot/chest-loot'
import { DefaultPlaceWithSafeArea } from 'modules/places/lib/DefaultWithSafeArea'
import { Furnacer } from '../../features/furnacer'
import gunsmith from './gunsmith'

class StoneQuarryBuilder extends DefaultPlaceWithSafeArea {
  witherBoss = new Boss({
    name: 'wither',
    displayName: 'Камнедробилка',
    entityTypeId: MinecraftEntityTypes.Wither,
    bossEvent: false,
    respawnTime: util.ms.from('hour', 1),
    loot: new Loot('wither drop').item('NetherStar').build,
  })

  commonOvener = new Furnacer({
    npc: {
      id: 'ovener',
      name: '§6Печкин',
    },

    furnaceTypeIds: [
      MinecraftBlockTypes.BlastFurnace,
      MinecraftBlockTypes.LitBlastFurnace,
      MinecraftBlockTypes.Furnace,
      MinecraftBlockTypes.LitFurnace,
    ],
    onlyInStoneQuarry: true,
  })

  foodOvener = new Furnacer({
    furnaceTypeIds: [MinecraftBlockTypes.LitBlastFurnace],
    npc: {
      id: 'foodOvener',
      name: '§6Пекарь',
    },
    onlyInStoneQuarry: false,
  })

  gunsmith = gunsmith(this.name)

  chestKit = new ChestLoot(
    'Сундук с наградой',
    this.name,
    this.name,
    new Loot(this.name + 'LootChest')
      .item('NetheriteSword')
      .enchantmetns({
        sharpness: {
          '1...2': '80%',
          '3...5': '20%',
        },
      })
      .item('Stonebrick')
      .amount({ '1...64': '100%' }).build,
    'overworld',
  )

  constructor() {
    super('Каменоломня')

    new Command('stnq').executes(ctx => {
      ctx.player.container?.clearAll()
      system.delay(() => {
        ctx.player.container?.addItem(this.chestKit.createKeyItemStack())
      })
    })
  }
}

export const StoneQuarry = new StoneQuarryBuilder()
