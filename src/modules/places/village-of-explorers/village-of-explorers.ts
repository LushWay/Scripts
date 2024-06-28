import { ItemStack } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { City } from '../lib/city'
import { Mage } from './mage'

export const BossSlimeBall = new ItemStack(MinecraftItemTypes.SlimeBall).setInfo(
  '§aМагическая слизь',
  'Используется у Инженера',
)

class VillageOfExporersBuilder extends City {
  constructor() {
    super('VillageOfExporers', 'Деревня исследователей')
    this.create()
  }

  slimeBoss = new Boss({
    group: this.group,
    id: 'slime',
    name: 'Магический Слайм',
    entityTypeId: MinecraftEntityTypes.Slime,
    respawnTime: ms.from('min', 10),
    loot: new Loot('slime boss')
      .itemStack(BossSlimeBall)
      .amount({
        '40...64': '2%',
        '65...128': '1%',
      })

      .item('SlimeBall')
      .amount({
        '0...10': '10%',
        '11...64': '40%',
        '65...256': '50%',
      }).build,
  })

  mage = new Mage(this.group)

  private create() {
    this.createKits(
      normal => normal.item('Dirt').build,
      donut => donut.itemStack(BossSlimeBall).build,
    )
  }
}

export const VillageOfExplorers = new VillageOfExporersBuilder()
