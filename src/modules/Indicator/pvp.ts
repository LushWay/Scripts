import { EntityDamageCause, Player, system, world } from '@minecraft/server'
import { Settings } from 'lib'
import { HealthIndicatorConfig } from './config'

// █

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
    // @ts-expect-error TS(2339) FIXME: Property 'enabled' does not exist on type '{}'.
    if (options.enabled) {
      for (const player of world.getPlayers({
        scoreOptions: [{ objective: 'pvp' }],
      })) {
        player.scores.pvp--
      }

      for (const e in HealthIndicatorConfig.lockDisplay) {
        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        if (HealthIndicatorConfig.lockDisplay[e]) HealthIndicatorConfig.lockDisplay[e]--
        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        else delete HealthIndicatorConfig.lockDisplay[e]
      }
    }
  },
  'PVP',
  20,
)

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Core'.
Core.afterEvents.worldLoad.subscribe(() => {
  system.runPlayerInterval(
    player => {
      // @ts-expect-error TS(2339) FIXME: Property 'enabled' does not exist on type '{}'.
      if (!options.enabled) return
      const score = player.scores.pvp

      // @ts-expect-error TS(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
      if (HealthIndicatorConfig.disabled.includes(player.id) || score < 0) return

      const settings = getPlayerSettings(player)
      if (!settings.indicator) return

      // @ts-expect-error TS(2339) FIXME: Property 'cooldown' does not exist on type '{}'.
      const q = score === options.cooldown || score === 0
      const g = (/** @type {string} */ p) => (q ? `§4${p}` : '')

      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      if (!HealthIndicatorConfig.lockDisplay[player.id]) {
        player.onScreenDisplay.setActionBar(`${g('»')} §6PvP: ${score} ${g('«')}`)
      }
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

function onDamage(event, fatal = false) {
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
    // @ts-expect-error TS(2339) FIXME: Property 'enabled' does not exist on type '{}'.
    !options.enabled ||
    // @ts-expect-error TS(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
    HealthIndicatorConfig.disabled.includes(event.hurtEntity.id)
  )
    return

  // Its player.chatClose
  if (!damage.damagingEntity && event.hurtEntity && damage.cause === EntityDamageCause.entityAttack) return

  const healthComponent = event.hurtEntity.getComponent('minecraft:health')
  if (!healthComponent) return
  const { currentValue: current, defaultValue: value } = healthComponent

  if (damage.damagingEntity instanceof Player) {
    // @ts-expect-error TS(2339) FIXME: Property 'cooldown' does not exist on type '{}'.
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
        damage.damagingEntity.runCommand(
          'titleraw @s actionbar ' +
            JSON.stringify({
              rawtext: [
                { text: '§6' },
                {
                  translate: `entity.${entityName}.name`,
                },
                { text: isBow ? ' §gзастрелен' : ' §gубит' },
              ],
            }),
        )
      }
      // }

      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      HealthIndicatorConfig.lockDisplay[damage.damagingEntity.id] = 2
    }
  }

  if (event.hurtEntity instanceof Player) {
    // skip SimulatedPlayer because of error
    if ('jump' in event.hurtEntity) return

    // @ts-expect-error TS(2339) FIXME: Property 'cooldown' does not exist on type '{}'.
    event.hurtEntity.scores.pvp = options.cooldown
    event.hurtEntity.scores.damageRecieve += event.damage
    if (fatal) event.hurtEntity.scores.deaths++
  }
}

/**
 * @param {Player} player
 * @param {number} health
 * @param {number} max
 */
function playHitSound(player, health, max) {
  health = ~~health
  max = ~~max
  const pitch = 2 + health / (max / 3)
  const options = {
    pitch: Math.max(1, pitch),
    volume: 4,
  }
  player.playSound('note.bell', options)
}
