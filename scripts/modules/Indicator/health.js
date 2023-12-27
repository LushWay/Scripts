import { Entity, system, Vector, world } from '@minecraft/server'
import { CUSTOM_ENTITIES, SYSTEM_ENTITIES } from 'config.js'
import { GAME_UTILS } from 'smapi.js'
import { HEALTH_INDICATOR } from './var.js'

/** @type {Record<string, {hurt_entity: string, hurt_type: string, indicator: string, damage: number}>} */
const HURT_ENTITIES = {}
const INDICATOR_TAG = 'HEALTH_INDICATOR'

/**
 * Entities that have nameTag "always_show": true and dont have boss_bar
 */
const ALWAYS_SHOWS = ['minecraft:player']

/**
 * List of families to indicate health
 */
const ALLOWED_FAMILIES = ['mob']

// Kill previosly used entities
getIndicators().forEach(e => e.remove())

world.afterEvents.entityHurt.subscribe(data => {
  const id = GAME_UTILS.safeGet(data.hurtEntity, 'id')
  if (!id || SYSTEM_ENTITIES.includes(id)) return
  if (!data.hurtEntity.isValid() || !data.hurtEntity.matches({ families: ALLOWED_FAMILIES })) return

  const hp = data.hurtEntity.getComponent('health')
  if (!hp || !hp.currentValue) return

  const { indicator, entityNameTag } = getIndicator(data.hurtEntity)

  HURT_ENTITIES[data.hurtEntity.id].damage += data.damage
  indicator.nameTag = getName(data.hurtEntity, hp)

  if (!entityNameTag) indicator.teleport(Vector.add(data.hurtEntity.getHeadLocation(), { x: 0, y: 1, z: 0 }))
})

world.afterEvents.entityDie.subscribe(data => {
  const id = GAME_UTILS.safeGet(data.deadEntity, 'id')

  if (!id || id === 'f:t' || !(id in HURT_ENTITIES)) return
  const { indicator, entityNameTag } = getIndicator(data.deadEntity)
  delete HURT_ENTITIES[id]

  if (!entityNameTag) indicator.remove()
})

system.runInterval(
  () => {
    for (const [id, info] of Object.entries(HURT_ENTITIES)) {
      const entity = world.overworld
        .getEntities({
          type: info.hurt_type,
        })
        .find(e => e.id === id)

      if (!entity) {
        getIndicators()
          .find(e => e.id === info.indicator)
          ?.remove()

        delete HURT_ENTITIES[id]
        continue
      }

      const { indicator, entityNameTag } = getIndicator(entity)

      indicator.nameTag = getName(entity)
      if (!entityNameTag) indicator.teleport(Vector.add(entity.getHeadLocation(), { x: 0, y: 1, z: 0 }))
    }
  },
  'hurt indicator',
  0
)

system.runInterval(
  () => {
    for (const id in HURT_ENTITIES) {
      const damage = HURT_ENTITIES[id].damage
      if (damage) HURT_ENTITIES[id].damage -= damage / 2
    }
  },
  'damage counter',
  20
)

let stat = false
new Command({ name: 'dmgstat', role: 'admin' }).executes(() => (stat = true))

/**
 * Gets damage indicator name depending on entity's currnet heart and damage applied
 * @param {Entity} entity
 * @returns {string}
 */
function getName(entity, hp = entity.getComponent('health')) {
  if (!hp) return ''
  const maxHP = hp.defaultValue

  const s = 50
  const scale = maxHP <= s ? 1 : maxHP / s

  const full = ~~(maxHP / scale)
  const current = ~~(hp.currentValue / scale)
  const damage = ~~(HURT_ENTITIES[entity.id].damage / scale)

  let bar = ''
  for (let i = 1; i <= full; i++) {
    if (i <= current) bar += '§c|'
    if (i > current && i <= current + damage) bar += '§e|'
    if (i > current + damage) bar += '§7|'
  }

  if (stat)
    world.debug({
      current,
      emit: current + 1,
      emitTo: current + damage + 1,
      empty: current + damage + 2,
      full,
    })

  return (
    bar +
    HEALTH_INDICATOR.name_modifiers
      .map(modifier => modifier(entity))
      .filter(result => result !== false)
      .join('')
  )
}

/**
 *
 * @param {Entity} entity
 * @param {number} damage
 * @returns {{indicator: Entity, entityNameTag: boolean}}
 */
function getIndicator(entity, damage = 0) {
  if (ALWAYS_SHOWS.includes(entity.typeId)) {
    HURT_ENTITIES[entity.id] ??= {
      damage,
      hurt_entity: entity.id,
      hurt_type: entity.typeId,
      indicator: 'NULL',
    }

    return { indicator: entity, entityNameTag: true }
  }

  if (entity && entity.id in HURT_ENTITIES) {
    const indicatorId = HURT_ENTITIES[entity.id].indicator
    const indicator = getIndicators().find(e => e && e.id === indicatorId)

    return {
      indicator: indicator ?? createIndicator(entity),
      entityNameTag: false,
    }
  }

  return { indicator: createIndicator(entity), entityNameTag: false }
}

/**
 *
 * @param {Entity} entity
 */
function createIndicator(entity) {
  const indicator = entity.dimension.spawnEntity('f:t', entity.getHeadLocation())

  indicator.nameTag = 'Loading...'
  indicator.addTag(INDICATOR_TAG)

  HURT_ENTITIES[entity.id] = {
    hurt_entity: entity.id,
    damage: 100,
    hurt_type: entity.typeId,
    indicator: indicator.id,
  }

  return indicator
}

function getIndicators() {
  return world.overworld.getEntities({
    type: CUSTOM_ENTITIES.floatingText,
    tags: [INDICATOR_TAG],
  })
}
