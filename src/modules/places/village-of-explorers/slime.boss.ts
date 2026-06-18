import { world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'

import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { i18nShared } from 'lib/i18n/text'
import { Boss } from 'lib/rpg/boss'
import { EquippmentLevel } from 'lib/rpg/equipment-level'
import { Loot } from 'lib/rpg/loot-table'
import { Group } from 'lib/rpg/place'
import { ms } from 'lib/utils/ms'
import { MagicSlimeBall } from './items'

export function createBossSlime(group: Group) {
  const boss = Boss.create()
    .group(group)
    .id('slime')
    .name(i18nShared`§a§lМагический слайм`)
    .typeId(MinecraftEntityTypes.Slime)
    .loot(
      new Loot('slime boss')
        .itemStack(MagicSlimeBall)
        .weight('100%')
        .amount({
          '10...20': '100%',
        })

        .item('SlimeBall')
        .weight('100%')
        .amount({
          '0...10': '10%',
          '11...60': '40%',
        }).build,
    )
    .respawnTime(ms.from('min', 10))
    .allowedEntities([])
    .spawnEvent(true)
    .equippmentLevel(EquippmentLevel.Level.Iron)
    .radius(30)
    .interval(boss => {
      if (!boss.location.valid || !boss.region || !boss.entity?.isValid) return

      const slimes = world.overworld.getEntities({
        location: boss.location,
        maxDistance: boss.region.area.radius,
        type: boss.entity.typeId,
      })
      if (!slimes.length) return

      const frogs = world.overworld.getEntities({
        location: boss.location,
        maxDistance: boss.region.area.radius + 10,
        type: MinecraftEntityTypes.Frog,
      })
      for (const frog of frogs) frog.remove()
    })

  boss.onBossEntityDie.subscribe(() => {
    if (boss.location.valid && boss.region) {
      const slimes = world.overworld.getEntities({
        location: boss.location,
        maxDistance: boss.region.area.radius,
        type: MinecraftEntityTypes.Slime,
      })

      slimes.forEach(e => e.remove())
    }
  })

  world.afterEvents.entityHurt.subscribe(({ hurtEntity }) => {
    if (!boss.location.valid || !boss.region || !boss.entity?.isValid) return
    if (hurtEntity.id !== boss.entity.id) return

    const health = hurtEntity.getComponent('health')
    if (!health) return

    const { currentValue: hp, effectiveMax: max } = health
    const half = max / 2
    if (hp < half) {
      const quarter = half / 2
      const level = hp < quarter ? 'big' : 'normal'

      const spawn = () => {
        hurtEntity.dimension.spawnEntity<CustomEntityTypes>(MinecraftEntityTypes.Slime, hurtEntity.location, {
          spawnEvent: `lw:slime_${level}`,
        })
      }

      spawn()
      if (level === 'big') spawn()
    }
  })

  return boss
}
