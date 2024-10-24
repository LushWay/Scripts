import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { Group } from 'lib/rpg/place'
import { Chip } from './engineer'

export function createBossGolem(group: Group) {
  const boss = Boss.create()
    .group(group)
    .id('golem')
    .name('Робот')
    .typeId(MinecraftEntityTypes.IronGolem)
    .loot(
      new Loot('GolemLoot')
        .itemStack(Chip)
        .amount({ '1...2': '1%' })
        .chance('20%')

        .itemStack(Chip)
        .amount({ '1...2': '1%' })
        .chance('20%')

        .itemStack(Chip)
        .amount({ '1...2': '1%' })
        .chance('20%').build,
    )
    .respawnTime(ms.from('min', 10))
    .allowedEntities('all')
    .spawnEvent(true)
    .radius()

  return boss
}
