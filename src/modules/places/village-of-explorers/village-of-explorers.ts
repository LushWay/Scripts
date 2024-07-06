import { ItemStack } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { City } from '../lib/city'
import { Stoner } from '../lib/npc/stoner'
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

  slimeBoss = Boss.create()
    .group(this.group)
    .id('slime')
    .name('Магический Слайм')
    .typeId(MinecraftEntityTypes.Slime)
    .loot(
      new Loot('slime boss')
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
    )
    .respawnTime(ms.from('min', 10))
    .spawnEvent(true)

  mage = new Mage(this.group)

  private create() {
    this.createKits(new Loot().item('Dirt').build, new Loot().itemStack(BossSlimeBall).build)
  }

  stoner = new Stoner(this.group)
}

export const VillageOfExplorers = new VillageOfExporersBuilder()
