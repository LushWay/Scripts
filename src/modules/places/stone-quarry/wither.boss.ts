import { BlockTypes, EntityComponentTypes } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { i18nShared, noI18n } from 'lib/i18n/text'
import { BigRegionStructure } from 'lib/region/big-structure'
import { Group } from 'lib/rpg/place'

export function createBossWither(group: Group) {
  const boss = Boss.create()
    .group(group)
    .id('wither')
    .name(i18nShared`Камнедробилка`)
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
    region.ldb ??= {}
    region.structure = new BigRegionStructure(region, 'boss-wither-big')

    if (!region.structure.exists) {
      try {
        await region.structure.save()
        console.info(noI18n`Saved structure for ${region.displayName}`)
      } catch (e) {
        console.warn(noI18n.warn`Unable to save structure for ${region.displayName}`)
      }
    }
  })

  boss.onEntitySpawn.subscribe(entity => {
    if (entity.typeId !== 'minecraft:item') return

    const itemComponent = entity.getComponent(EntityComponentTypes.Item)
    if (!itemComponent) return entity.remove()

    if (BlockTypes.get(itemComponent.itemStack.typeId)) entity.remove()
  })

  boss.onBossEntityDie.subscribe(() => {
    boss.region?.structure?.place()
  })

  return boss
}
