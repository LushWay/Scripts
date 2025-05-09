import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { RegionStructure } from 'lib/region/structure'
import { Group } from 'lib/rpg/place'
import { t } from 'lib/text'

export function createBossWither(group: Group) {
  const boss = Boss.create()
    .group(group)
    .id('wither')
    .name('Камнедробилка')
    .typeId(MinecraftEntityTypes.Wither)
    .loot(new Loot().item('NetherStar').build)
    .respawnTime(ms.from('hour', 1))
    .allowedEntities([
      MinecraftEntityTypes.Arrow,
      MinecraftEntityTypes.WitherSkeleton,
      MinecraftEntityTypes.WitherSkull,
      MinecraftEntityTypes.WitherSkullDangerous,
    ])
    .spawnEvent(true)
    .radius(30)

  boss.onRegionCreate.subscribe(async region => {
    region.structure = new RegionStructure(region, 'boss-wither')

    if (!region.structure.exists) {
      try {
        await region.structure.save()
        console.info(t`Saved structure for ${region.displayName}`)
      } catch (e) {
        console.warn(t.warn`Unable to save structure for ${region.displayName}`)
      }
    }
  })

  boss.onEntityDie.subscribe(() => {
    boss.region?.structure?.place()
  })

  return boss
}
