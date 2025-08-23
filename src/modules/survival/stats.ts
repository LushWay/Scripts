import { EntityDamageCause, Player, type ScoreNames, TicksPerSecond, system, world } from '@minecraft/server'
import { capitalize } from 'lib/util'

const interval = 20
const time = TicksPerSecond * interval
system.runPlayerInterval(
  player => {
    const lastSeen = ~~(Date.now() / 1000)
    player.scores.lastSeenDate = lastSeen
    player.scores.totalOnlineTime += time
    if (player.database.inv === 'anarchy') {
      player.scores.anarchyOnlineTime += time
      player.scores.anarchyLastSeenDate = lastSeen
    }
  },
  'player stats',
  interval,
)

function count(player: Player, stat: ScoreNames.Stat, add = 1) {
  player.scores[stat] += add
  if (player.database.inv === 'anarchy') player.scores[`anarchy${capitalize(stat)}`] += add
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn) return
  if (player.scores.joinDate === 0) player.scores.joinDate = ~~(Date.now() / 1000)
})

world.afterEvents.playerPlaceBlock.subscribe(({ player }) => {
  count(player, 'blocksPlaced')
})

world.afterEvents.playerBreakBlock.subscribe(({ player }) => {
  count(player, 'blocksBroken')
})

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
  if (deadEntity instanceof Player) {
    count(deadEntity, 'deaths')
  }

  if (damageSource.damagingEntity instanceof Player) {
    count(damageSource.damagingEntity, 'kills')
  }
})

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource }) => {
  if (hurtEntity instanceof Player) {
    // when player is being healed by effect with 255 strength it is recieving -2142941984 damage
    if (damage < 0) return

    // closeChat uses entityAttack but has no entity and projectile
    if (
      damageSource.cause === EntityDamageCause.entityAttack &&
      !damageSource.damagingEntity &&
      !damageSource.damagingProjectile
    )
      return

    count(hurtEntity, 'damageRecieve', damage)
  }

  if (damageSource.damagingEntity instanceof Player) {
    count(damageSource.damagingEntity, 'damageGive', damage)
  }
})
