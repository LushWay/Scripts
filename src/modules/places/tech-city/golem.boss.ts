import { world } from '@minecraft/server'
import { MinecraftEffectTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms, Vec } from 'lib'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { Chip } from './engineer'

export function createBossGolem(group: Group) {
  const boss = Boss.create()
    .group(group)
    .id('golem')
    .name(i18nShared`Робот`)
    .typeId(MinecraftEntityTypes.IronGolem)
    .loot(
      new Loot('GolemLoot')
        .itemStack(Chip)
        .amount({ '1...2': '1%' })
        .weight('20%')

        .itemStack(Chip)
        .amount({ '1...2': '1%' })
        .weight('20%')

        .itemStack(Chip)
        .amount({ '1...2': '1%' })
        .weight('20%').build,
    )
    .respawnTime(ms.from('min', 10))
    .allowedEntities('all')
    .spawnEvent(true)
    .radius()

  world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource: { damagingEntity } }) => {
    if (!boss.location.valid || !boss.region || !boss.entity?.isValid) return
    if (hurtEntity.id !== boss.entity.id) return

    const health = hurtEntity.getComponent('health')
    if (!health) return

    const { currentValue: hp, effectiveMax: max } = health
    const half = max / 2
    if (hp < half) {
      const quarter = half / 2
      const lessThenQuarter = hp < quarter

      hurtEntity.addEffect(MinecraftEffectTypes.Speed, 60, { amplifier: 3 })
      const boss = hurtEntity.location
      const player = damagingEntity
      if (player && player.location.y - 2 > hurtEntity.location.y && lessThenQuarter) {
        const distance = Vec.subtract(boss, player.location).multiply(0.5)
        player.applyKnockback(distance, distance.y)
      }
    }
  })

  return boss
}
