import { EntityDamageCause, EntityHurtAfterEvent, Player, system, world } from '@minecraft/server'
import { Boss, BossArenaRegion, LockAction, ms, Settings } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { Core } from 'lib/extensions/core'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n } from 'lib/i18n/text'
import { RegionEvents } from 'lib/region/events'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { Anarchy } from 'modules/places/anarchy/anarchy'

const settings = Settings.world(...Settings.worldCommon, {
  pvpEnabled: {
    value: true,
    description: 'Возможность входа в сражения режим (блокировка всех тп команд)',
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
  pvpKillOnJoin: {
    value: true,
    description: 'Убивать игрока, зашедшего на анархию после выхода с сервера со незавершенным таймером сражения',
    name: 'Убивать вышедшего в сражении',
  },
})

const getPlayerSettings = Settings.player('PvP/PvE', 'pvp', {
  indicator: {
    name: i18n`Индикатор`,
    description: i18n`Индикатор попадания по существу из лука`,
    value: true,
  },
  bowSound: {
    name: i18n`Звук лука`,
    description: i18n`Звук попадания по существо из лука`,
    value: true,
  },
})

const lockAction = new LockAction(p => p.scores.pvp > 0, i18n`Вы находитесь в режиме сражения!`)

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (deadEntity.isPlayer()) deadEntity.scores.pvp = 0
})

system.runInterval(
  () => {
    if (settings.pvpEnabled) {
      for (const player of world.getAllPlayers()) {
        if (player.scores.pvp) player.scores.pvp--
      }
    }
  },
  'PVP',
  20,
)

const playerTimeouts = new WeakPlayerMap<{ expires: number; callback: VoidFunction }>({ removeOnLeave: true })

RegionEvents.onPlayerRegionsChange.subscribe(({ player, newest, previous }) => {
  if (!lockAction.isLocked(player)) return

  const region = previous.find(e => e instanceof BossArenaRegion)

  if (lockAction.isLocked(player) && region && !newest.some(e => e instanceof BossArenaRegion)) {
    const boss = region.boss
    region.returnEntity(player, boss?.location.valid ? boss.location : undefined)
    playerTimeouts.set(player, {
      expires: Date.now() + ms.from('sec', 4),
      callback() {
        if (lockAction.isLocked(player) && !region.area.isIn(player)) {
          player.teleport(region.area.center)
        }
      },
    })
  }
})

system.runInterval(
  () => {
    for (const [player, { expires, callback }] of playerTimeouts) {
      if (expires < Date.now()) {
        callback()
        playerTimeouts.delete(player)
      }
    }
  },
  'returning',
  20,
)

Core.afterEvents.worldLoad.subscribe(() => {
  system.runPlayerInterval(
    player => {
      if (!settings.pvpEnabled) return
      const score = player.scores.pvp

      if (score <= 0) return

      const psettings = getPlayerSettings(player)
      if (!psettings.indicator) return

      const q =
        score === settings.pvpBossCooldown ||
        score === settings.pvpMonsterCooldown ||
        score === settings.pvpPlayerCooldown ||
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

  // Reset on respawn
  world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
    if (!settings.pvpEnabled) return
    if (!initialSpawn) player.scores.pvp = 0
  })

  Anarchy.onPlayerFirstEnter.subscribe(({ player }) => {
    if (!settings.pvpEnabled) return

    if (player.scores.pvp > 0) {
      player.warn(i18n.warn`Вы вышли из сервера во время сражения, поэтому были убиты при входе.`)
      player.kill()
    }
  })
})

function onDamage(
  { damage, hurtEntity, damageSource: { damagingEntity, cause } }: EntityHurtAfterEvent,
  fatal = false,
) {
  if (!hurtEntity.isValid) return

  if (
    ![
      EntityDamageCause.fireTick,
      EntityDamageCause.fireworks,
      EntityDamageCause.projectile,
      EntityDamageCause.entityAttack,
    ].includes(cause)
  )
    return

  const hurtBoss = Boss.isBoss(hurtEntity)

  if (
    !hurtEntity.typeId.startsWith('minecraft:') ||
    !(hurtEntity.isPlayer() || hurtEntity.matches({ families: ['monster'] }) || hurtBoss) ||
    !settings.pvpEnabled
  )
    return

  // Its player.chatClose
  if (!damagingEntity && hurtEntity.isPlayer() && cause === EntityDamageCause.entityAttack) return

  const healthComponent = hurtEntity.getComponent('minecraft:health')
  if (!healthComponent) return
  const { currentValue: current, defaultValue: value } = healthComponent

  const cooldown =
    damagingEntity?.isPlayer() && hurtEntity.isPlayer()
      ? settings.pvpPlayerCooldown
      : hurtBoss || (damagingEntity && Boss.isBoss(damagingEntity))
        ? settings.pvpBossCooldown
        : settings.pvpMonsterCooldown

  if (damagingEntity?.isPlayer()) {
    damagingEntity.scores.pvp = Math.max(damagingEntity.scores.pvp, cooldown)
    damagingEntity.scores.damageGive += damage
    if (fatal) damagingEntity.scores.kills++

    const psetting = getPlayerSettings(damagingEntity)

    const isBow = cause === EntityDamageCause.projectile
    if (isBow && psetting.bowSound) {
      playHitSound(damagingEntity, current, value)
    }

    if (psetting.indicator) {
      if (!fatal) {
        // damagingEntity.onScreenDisplay.setActionBar(`§c-${damage}♥`)
      } else {
        // Kill
        if (hurtEntity instanceof Player) {
          // Player
          damagingEntity.onScreenDisplay.setActionBar(
            `${isBow ? emoji.custom.kill : emoji.custom.kill} ${hurtEntity.name}`,
            ActionbarPriority.High,
          )
        } else {
          // Entity
          const entityName = hurtEntity.typeId.replace('minecraft:', '')
          damagingEntity.onScreenDisplay.setActionBar(
            { rawtext: [{ text: emoji.custom.kill + ' ' }, { translate: `entity.${entityName}.name` }] },
            ActionbarPriority.High,
          )
        }
      }
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
