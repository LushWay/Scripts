import { BlockTypes, EntityComponentTypes } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'

import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { MinecraftI18nMessage } from 'lib/i18n/message'
import { noI18n } from 'lib/i18n/text'
import { BigRegionStructure } from 'lib/region/big-structure'
import { Boss } from 'lib/rpg/boss'
import { EquippmentLevel } from 'lib/rpg/equipment-level'
import { Loot } from 'lib/rpg/loot-table'
import { Group } from 'lib/rpg/place'
import { ms } from 'lib/utils/ms'

export function createBossWither(group: Group) {
  const boss = Boss.create()
    .group(group)
    .id('wither')
    .name(new MinecraftI18nMessage(`entity.${CustomEntityTypes.Wither}.name`))
    .typeId(CustomEntityTypes.Wither)
    .loot(new Loot().item('NetherStar').build)
    .respawnTime(ms.from('hour', 1))
    .allowedEntities([
      MinecraftEntityTypes.Arrow,
      MinecraftEntityTypes.WitherSkeleton,
      MinecraftEntityTypes.WitherSkull,
      MinecraftEntityTypes.WitherSkullDangerous,
    ])
    .spawnEvent(false)
    .equippmentLevel(EquippmentLevel.Level.Diamond)
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
