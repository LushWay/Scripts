import { EntityDamageCause, Player, TicksPerSecond, system, world } from '@minecraft/server'

const interval = 20
const time = TicksPerSecond * interval
system.runPlayerInterval(
  player => {
    player.scores.lastSeenDate = ~~(Date.now() / 1000)
    player.scores.totalOnlineTime += time
    if (player.database.inv === 'anarchy') player.scores.anarchyOnlineTime += time
  },
  'player stats',
  interval,
)

world.afterEvents.playerPlaceBlock.subscribe(({ player }) => {
  player.scores.blocksPlaced++
})

world.afterEvents.playerBreakBlock.subscribe(({ player }) => {
  player.scores.blocksBroke++
})

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
  if (deadEntity instanceof Player) {
    deadEntity.scores.deaths++
  }

  if (damageSource.damagingEntity instanceof Player) {
    damageSource.damagingEntity.scores.kills++
  }
})

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource }) => {
  if (hurtEntity instanceof Player) {
    // when player is healing it is reciveng -2142941984 damage
    if (damage < 0) return

    // closeChat uses entityAttack but has no entity and projectile
    if (
      damageSource.cause === EntityDamageCause.entityAttack &&
      !damageSource.damagingEntity &&
      !damageSource.damagingProjectile
    )
      return

    hurtEntity.scores.damageRecieve += damage
  }

  if (damageSource.damagingEntity instanceof Player) {
    damageSource.damagingEntity.scores.damageGive += damage
  }
})
