import { Entity, EntityDamageCause, Player, system, world } from '@minecraft/server'
import { Settings } from 'smapi.js'
import { Server } from '../Server/index.js'
import { HEALTH_INDICATOR } from './var.js'

const options = Settings.world('pvp', {
  enabled: {
    value: Server.type === 'survival',
    desc: 'Возможность входа в пвп режим (блокировка всех тп команд)§r',
    name: 'Включено',
  },
  cooldown: { value: 15, desc: 'Время блокировки в секундах', name: 'Время' },
})

const getPlayerSettings = Settings.player('PvP', 'pvp', {
  indicator: {
    name: 'Индикатор',
    desc: '§aВключает§7 индикатор попадания по энтити из лука',
    value: true,
  },
  bow_sound: {
    name: 'Звук лука',
    desc: '§aВключает§7 звук попадания по энтити из лука',
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

SM.afterEvents.modulesLoad.subscribe(() => {
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

  world.afterEvents.entityDie.subscribe(data => {
    onDamage(
      {
        damage: 999999,
        damageSource: data.damageSource,
        hurtEntity: data.deadEntity,
      },
      true
    )
  })
  world.afterEvents.entityHurt.subscribe(data => {
    onDamage(data, false)
  })
})

/**
 *
 * @param {{damageSource: import("@minecraft/server").EntityDamageSource, hurtEntity: Entity, damage: number}} data
 * @param {boolean} fatal
 * @returns
 */
function onDamage(data, fatal = false) {
  const damage = data.damageSource
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
    !data.hurtEntity.typeId.startsWith('minecraft:') ||
    !options.enabled ||
    HEALTH_INDICATOR.disabled.includes(data.hurtEntity.id)
  )
    return

  // Its player.chatClose
  if (!damage.damagingEntity && data.hurtEntity && damage.cause === EntityDamageCause.entityAttack) return

  const { currentValue: current, defaultValue: value } = data.hurtEntity.getComponent('minecraft:health')

  if (damage.damagingEntity instanceof Player) {
    damage.damagingEntity.scores.pvp = options.cooldown
    Server.stats.damageGive.add(damage.damagingEntity, data.damage)
    if (fatal) Server.stats.kills.add(damage.damagingEntity, 1)

    const setting = getPlayerSettings(damage.damagingEntity)

    const isBow = damage.cause === EntityDamageCause.projectile
    if (isBow && setting.bow_sound) {
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
      if (data?.hurtEntity instanceof Player) {
        // Player
        damage.damagingEntity.onScreenDisplay.setActionBar(
          `§gВы ${isBow ? 'застрелили' : 'убили'} §6${data.hurtEntity.name}`
        )
      } else {
        // Entity

        const entityName = data.hurtEntity.typeId.replace('minecraft:', '')
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

  if (data.hurtEntity instanceof Player) {
    // skip SimulatedPlayer because of error
    if ('jump' in data.hurtEntity) return

    data.hurtEntity.scores.pvp = options.cooldown
    Server.stats.damageRecieve.add(data.hurtEntity, data.damage)
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
