import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { Group } from 'lib/rpg/place'

export function createBossWither(group: Group) {
  const boss = Boss.create()
    .group(group)
    .id('wither')
    .name('Камнедробилка')
    .typeId(MinecraftEntityTypes.Wither)
    .loot(new Loot().item('NetherStar').build)
    .respawnTime(ms.from('hour', 1))
    .allowedEntities('all')
    .spawnEvent(true)

  return boss
}
