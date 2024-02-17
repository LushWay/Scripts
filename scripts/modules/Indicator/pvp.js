import { Entity, EntityDamageCause, Player, system, world } from '@minecraft/server'
import { Settings } from 'lib.js'
import { HEALTH_INDICATOR } from './var.js'

const options = Settings.world('pvp', {
  enabled: {
    value: true,
    desc: 'Возможность входа в пвп режим (блокировка всех тп команд)§r',
    name: 'Включено',
  },
  cooldown: { value: 15, desc: 'Время блокировки в секундах', name: 'Время' },
})

const getPlayerSettings = Settings.player('PvP/PvE', 'pvp', {
  indicator: {
    name: 'Индикатор',
    desc: 'Индикатор попадания по существу из лука',
    value: true,
  },
  bowSound: {
    name: 'Звук лука',
    desc: 'Звук попадания по существо из лука',
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

      for (const e in HEALTH_INDICATOR.lock_display) {
        if (HEALTH_INDICATOR.lock_display[e]) HEALTH_INDICATOR.lock_display[e]--
        else delete HEALTH_INDICATOR.lock_display[e]
      }
    }
  },
  'PVP',
  20
)

SM.afterEvents.worldLoad.subscribe(() => {
  system.runPlayerInterval(
    player => {
      if (!options.enabled) return
      const score = player.scores.pvp

      if (HEALTH_INDICATOR.disabled.includes(player.id) || score < 0) return

      const settings = getPlayerSettings(player)
      if (!settings.indicator) return

      const q = score === options.cooldown || score === 0
      const g = (/** @type {string} */ p) => (q ? `§4${p}` : '')

      if (!HEALTH_INDICATOR.lock_display[player.id]) {
        player.onScreenDisplay.setActionBar(`${g('»')} §6PvP: ${score} ${g('«')}`)
      }
    },
    'PVP player',
    0
  )

  world.afterEvents.entityDie.subscribe(event => {
    onDamage(
      {
        damage: 999999,
        damageSource: event.damageSource,
        hurtEntity: event.deadEntity,
      },
      true
    )
  })
  world.afterEvents.entityHurt.subscribe(event => {
    onDamage(event, false)
  })
})

/**
 *
 * @param {{damageSource: import("@minecraft/server").EntityDamageSource, hurtEntity: Entity, damage: number}} event
 * @param {boolean} fatal
 * @returns
 */
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
    !options.enabled ||
    HEALTH_INDICATOR.disabled.includes(event.hurtEntity.id)
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
          `§gВы ${isBow ? 'застрелили' : 'убили'} §6${event.hurtEntity.name}`
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
            })
        )
      }
      // }

      HEALTH_INDICATOR.lock_display[damage.damagingEntity.id] = 2
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

/**
 *
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
