import { ItemStack } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, util } from 'lib'
import { PlaceWithSafeArea } from 'modules/places/lib/place-with-safearea'

export const BossSlimeBall = new ItemStack(MinecraftItemTypes.SlimeBall).setInfo(
  '§aМагическая слизь',
  'Используется у Инженера',
)

class VillageOfExporersBuilder extends PlaceWithSafeArea {
  constructor() {
    super('VillageOfExporers', 'Деревня исследователей')
  }

  slimeBoss = new Boss({
    group: this.group,
    id: 'slime',
    name: 'Магический Слайм',
    entityTypeId: MinecraftEntityTypes.Slime,
    respawnTime: util.ms.from('min', 10),
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
}

export const VillageOfExplorers = new VillageOfExporersBuilder()
