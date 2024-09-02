import { EntityDamageCause, EntityHurtAfterEvent, Player, system, world } from '@minecraft/server'
import { Boss, LockAction, Settings } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { Core } from 'lib/extensions/core'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { HealthIndicatorConfig } from './config'

// █

const { lockDisplay } = HealthIndicatorConfig

const options = Settings.world(...Settings.worldCommon, {
  pvpEnabled: {
    value: true,
    description: 'Возможность входа в сражения режим (блокировка всех тп команд)§r',
    name: 'Режим сражения',
  },
  pvpPlayerCooldown: {
    value: 60,
    description: 'Время блокировки в режиме сражения в секундах',
    name: 'Время сражения',
  },
  pvpMonsterCooldown: {
    value: 15,
    description: 'Время блокировки в режиме сражения в секундах',
    name: 'Время сражения с монстрами',
  },
  pvpBossCooldown: {
    value: 120,
    description: 'Время блокировки в режиме сражения в секундах',
    name: 'Время сражения с боссом',
  },
})

const getPlayerSettings = Settings.player('PvP/PvE', 'pvp', {
  indicator: {
    name: 'Индикатор',
    description: 'Индикатор попадания по существу из лука',
    value: true,
  },
  bowSound: {
    name: 'Звук лука',
    description: 'Звук попадания по существо из лука',
    value: true,
  },
})

new LockAction(p => p.scores.pvp > 0, 'Вы находитесь в режиме сражения!')

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (deadEntity.isPlayer()) deadEntity.scores.pvp = 0
})

system.runInterval(
  () => {
    if (options.pvpEnabled) {
      for (const player of world.getAllPlayers()) {
        if (player.scores.pvp) player.scores.pvp--
      }

      for (const [key, value] of lockDisplay.entries()) {
        if (value) lockDisplay.set(key, value - 1)
        else lockDisplay.delete(key)
      }
    }
  },
  'PVP',
  20,
)

Core.afterEvents.worldLoad.subscribe(() => {
  system.runPlayerInterval(
    player => {
      if (!options.pvpEnabled) return
      const score = player.scores.pvp

      if (HealthIndicatorConfig.disabled.includes(player.id) || score <= 0) return

      const settings = getPlayerSettings(player)
      if (!settings.indicator) return

      const q =
        score === options.pvpBossCooldown ||
        score === options.pvpMonsterCooldown ||
        score == options.pvpPlayerCooldown ||
        score === 1
      const g = (p: string) => (q ? `§4${p}` : '')

      player.onScreenDisplay.setActionBar(`${g('» ')}${emoji.custom.sword} §f${score}${g(' «')}`, ActionbarPriority.PvP)
    },
    'PVP player',
    0,
  )

  world.afterEvents.entityDie.subscribe(({ damageSource, deadEntity }) => {
    onDamage(
      {
        damage: 999999,
        damageSource,
        hurtEntity: deadEntity,
      },
      true,
    )
  })

  world.afterEvents.entityHurt.subscribe(event => {
    onDamage(event, false)
  })
})

function onDamage(
  { damage, hurtEntity, damageSource: { damagingEntity, cause } }: EntityHurtAfterEvent,
  fatal = false,
) {
  if (
    ![
      EntityDamageCause.fireTick,
      EntityDamageCause.fireworks,
      EntityDamageCause.projectile,
      EntityDamageCause.entityAttack,
    ].includes(cause)
  )
    return

  if (
    !hurtEntity.typeId.startsWith('minecraft:') ||
    !(hurtEntity.isPlayer() || hurtEntity.matches({ families: ['monster'] })) ||
    !options.pvpEnabled ||
    HealthIndicatorConfig.disabled.includes(hurtEntity.id)
  )
    return

  // Its player.chatClose
  if (!damagingEntity && hurtEntity.isPlayer() && cause === EntityDamageCause.entityAttack) return

  const healthComponent = hurtEntity.getComponent('minecraft:health')
  if (!healthComponent) return
  const { currentValue: current, defaultValue: value } = healthComponent

  const cooldown =
    damagingEntity?.isPlayer() && hurtEntity.isPlayer()
      ? options.pvpPlayerCooldown
      : Boss.isBoss(hurtEntity)
        ? options.pvpBossCooldown
        : options.pvpMonsterCooldown

  if (damagingEntity?.isPlayer()) {
    damagingEntity.scores.pvp = Math.max(damagingEntity.scores.pvp, cooldown)
    damagingEntity.scores.damageGive += damage
    if (fatal) damagingEntity.scores.kills++

    const setting = getPlayerSettings(damagingEntity)

    const isBow = cause === EntityDamageCause.projectile
    if (isBow && setting.bowSound) {
      playHitSound(damagingEntity, current, value)
    }

    if (setting.indicator) {
      if (!fatal) {
        // damagingEntity.onScreenDisplay.setActionBar(`§c-${damage}♥`)
      } else {
        // Kill
        if (hurtEntity instanceof Player) {
          // Player
          damagingEntity.onScreenDisplay.setActionBar(
            `${isBow ? emoji.custom.kill : emoji.custom.kill} ${hurtEntity.name}`,
            ActionbarPriority.UrgentNotificiation,
          )
        } else {
          // Entity
          const entityName = hurtEntity.typeId.replace('minecraft:', '')
          damagingEntity.onScreenDisplay.setActionBar(
            { rawtext: [{ text: emoji.custom.kill + ' ' }, { translate: `entity.${entityName}.name` }] },
            ActionbarPriority.UrgentNotificiation,
          )
        }
      }

      lockDisplay.set(damagingEntity.id, 2)
    }
  }

  if (hurtEntity instanceof Player) {
    // skip SimulatedPlayer because of error
    if ('jump' in hurtEntity) return
    hurtEntity.scores.pvp = Math.max(hurtEntity.scores.pvp, cooldown)
    hurtEntity.scores.damageRecieve += damage
    if (fatal) hurtEntity.scores.deaths++
  }
}

function playHitSound(player: Player, health: number, max: number) {
  health = ~~health
  max = ~~max
  const pitch = 2 + health / (max / 3)
  const options = {
    pitch: Math.max(1, pitch),
    volume: 4,
  }
  player.playSound('note.bell', options)
}
