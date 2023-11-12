import { Entity, system, Vector, world } from '@minecraft/server'
import { PVP } from './var.js'

/** @type {Record<string, {hurt_entity: string, hurt_type: string, indicator: string, damage: number}>} */
const HURT_ENTITIES = {}
const INDICATOR_TAG = 'HEALTH_INDICATOR'

/**
 * Entities that have nameTag "always_show": true
 */
const ALWAYS_SHOWS = [
  //"minecraft:warden",
  'minecraft:player',
]

/**
 * Families that are allowed
 */
const FAMILIES = ['player', 'monster']

/**
 * List of entity ids to skip (updates dynamically)
 */
const NOT_SHOWN = []

// Kill previosly used entities
getIndicators().forEach(e => {
  e.teleport({ x: 0, y: -64, z: 0 })
  e.triggerEvent('f:t:kill')
})

world.afterEvents.entityHurt.subscribe(data => {
  if (data.hurtEntity.id === 'f:t') return

  const hp = data.hurtEntity.getComponent('health')
  if (!hp.currentValue) return

  const { indicator, entityNameTag } = getIndicator(data.hurtEntity)

  HURT_ENTITIES[data.hurtEntity.id].damage += data.damage
  indicator.nameTag = getName(data.hurtEntity, hp)

  if (!entityNameTag)
    indicator.teleport(
      Vector.add(data.hurtEntity.getHeadLocation(), { x: 0, y: 1, z: 0 })
    )
})

world.afterEvents.entityDie.subscribe(data => {
  let id
  try {
    id = data.deadEntity.id
  } catch (e) {
    return
  }

  if (id === 'f:t') return
  if (!(data.deadEntity.id in HURT_ENTITIES)) return

  const { indicator, entityNameTag } = getIndicator(data.deadEntity)

  delete HURT_ENTITIES[data.deadEntity.id]

  if (!entityNameTag) {
    system.run(() => {
      indicator.teleport({ x: 0, y: -64, z: 0 })
      indicator.triggerEvent('f:t:kill')
    })
  }
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
          ?.triggerEvent('f:t:kill')

        delete HURT_ENTITIES[id]
        continue
      }

      const { indicator, entityNameTag } = getIndicator(entity)

      indicator.nameTag = getName(entity)
      if (!entityNameTag)
        indicator.teleport(
          Vector.add(entity.getHeadLocation(), { x: 0, y: 1, z: 0 })
        )
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
new XCommand({ name: 'dmgstat', role: 'admin' }).executes(() => (stat = true))

/**
 * Gets damage indicator name depending on entity's currnet heart and damage applied
 * @param {Entity} entity
 * @returns {string}
 */
function getName(entity, hp = entity.getComponent('health')) {
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
    PVP.name_modifiers
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
  const indicator = entity.dimension.spawnEntity(
    'f:t',
    entity.getHeadLocation()
  )

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
    type: 'f:t',
    tags: [INDICATOR_TAG],
  })
}
