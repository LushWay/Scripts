import { EntityDamageCause, EntityHurtAfterEvent, Player, system, world } from '@minecraft/server'
import { Settings } from 'lib'
import { HealthIndicatorConfig } from './config'
import { Core } from 'lib/extensions/core'

// █

const { lockDisplay } = HealthIndicatorConfig

const options = Settings.world('pvp', {
  enabled: {
    value: true,
    description: 'Возможность входа в пвп режим (блокировка всех тп команд)§r',
    name: 'Включено',
  },
  cooldown: { value: 15, description: 'Время блокировки в секундах', name: 'Время' },
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

system.runInterval(
  () => {
    if (options.enabled) {
      for (const player of world.getPlayers({
        scoreOptions: [{ objective: 'pvp' }],
      })) {
        player.scores.pvp--
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
      if (!options.enabled) return
      const score = player.scores.pvp

      if (HealthIndicatorConfig.disabled.includes(player.id) || score < 0) return

      const settings = getPlayerSettings(player)
      if (!settings.indicator) return

      const q = score === options.cooldown || score === 0
      const g = (p: string) => (q ? `§4${p}` : '')

      if (!lockDisplay.has(player.id)) player.onScreenDisplay.setActionBar(`${g('»')} §6PvP: ${score} ${g('«')}`)
    },
    'PVP player',
    0,
  )

  world.afterEvents.entityDie.subscribe(event => {
    onDamage(
      {
        damage: 999999,
        damageSource: event.damageSource,
        hurtEntity: event.deadEntity,
      },
      true,
    )
  })

  world.afterEvents.entityHurt.subscribe(event => {
    onDamage(event, false)
  })
})

function onDamage(event: EntityHurtAfterEvent, fatal = false) {
  const damage = event.damageSource
  if (
    ![
      EntityDamageCause.fireTick,
      EntityDamageCause.fireworks,
      EntityDamageCause.projectile,
      EntityDamageCause.entityAttack,
    ].includes(damage.cause)
  )
    return

  if (
    !event.hurtEntity.typeId.startsWith('minecraft:') ||
    !options.enabled ||
    HealthIndicatorConfig.disabled.includes(event.hurtEntity.id)
  )
    return

  // Its player.chatClose
  if (!damage.damagingEntity && event.hurtEntity && damage.cause === EntityDamageCause.entityAttack) return

  const healthComponent = event.hurtEntity.getComponent('minecraft:health')
  if (!healthComponent) return
  const { currentValue: current, defaultValue: value } = healthComponent

  if (damage.damagingEntity instanceof Player) {
    damage.damagingEntity.scores.pvp = options.cooldown
    damage.damagingEntity.scores.damageGive += event.damage
    if (fatal) damage.damagingEntity.scores.kills++

    const setting = getPlayerSettings(damage.damagingEntity)

    const isBow = damage.cause === EntityDamageCause.projectile
    if (isBow && setting.bowSound) {
      playHitSound(damage.damagingEntity, current, value)
    }

    if (setting.indicator && fatal) {
      // remove fatal        ^ and uncomment code \/
      // if (!fatal) {
      // 	damage.damagingEntity.onScreenDisplay.setActionBar(
      // 		`§c-${data.damage}♥`
      // 	);
      // } else {
      // Kill
      if (event?.hurtEntity instanceof Player) {
        // Player
        damage.damagingEntity.onScreenDisplay.setActionBar(
          `§gВы ${isBow ? 'застрелили' : 'убили'} §6${event.hurtEntity.name}`,
        )
      } else {
        // Entity

        const entityName = event.hurtEntity.typeId.replace('minecraft:', '')
        damage.damagingEntity.onScreenDisplay.setActionBar({
          rawtext: [
            { text: '§6' },
            {
              translate: `entity.${entityName}.name`,
            },
            { text: isBow ? ' §gзастрелен' : ' §gубит' },
          ],
        })
      }
      // }

      lockDisplay.set(damage.damagingEntity.id, 2)
    }
  }

  if (event.hurtEntity instanceof Player) {
    // skip SimulatedPlayer because of error
    if ('jump' in event.hurtEntity) return

    event.hurtEntity.scores.pvp = options.cooldown
    event.hurtEntity.scores.damageRecieve += event.damage
    if (fatal) event.hurtEntity.scores.deaths++
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
