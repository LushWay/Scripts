import { Entity, Player, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { CUSTOM_ENTITIES, SYSTEM_ENTITIES } from 'config.js'
import { PLAYER_NAME_TAG_MODIFIERS, setNameTag } from 'modules/Indicator/playerNameTag.js'
import { GAME_UTILS, util } from 'smapi.js'

/**
 * @type {Record<string, ({
 *   separated: false
 * } | {
 *   separated: true
 *   indicator: Entity,
 * }) & {
 *   hurtEntity: Entity,
 *   damage: number,
 *   expires: number
 * }>}
 */
const HURT_ENTITIES = {}
const INDICATOR_TAG = 'HEALTH_INDICATOR'

/**
 * Entities that have nameTag "always_show": true and dont have boss_bar
 * @type {string[]}
 */
const ALWAYS_SHOWS = [MinecraftEntityTypes.Player]

/**
 * List of families to indicate health
 */
const ALLOWED_FAMILIES = ['monster']

// Show indicator on hurt
world.afterEvents.entityHurt.subscribe(data => {
  // Validate entity
  const id = GAME_UTILS.safeGet(data.hurtEntity, 'id')
  if (!id || SYSTEM_ENTITIES.includes(id)) return
  if (
    !data.hurtEntity.isValid() ||
    !(data.hurtEntity.matches({ families: ALLOWED_FAMILIES }) || data.hurtEntity instanceof Player)
  )
    return

  updateIndicator({ entity: data.hurtEntity, damage: data.damage })
})

// Remove indicator
world.afterEvents.entityDie.subscribe(data => {
  const id = GAME_UTILS.safeGet(data.deadEntity, 'id')
  if (!id) return

  const info = HURT_ENTITIES[id]
  if (!info) return

  if (info.separated) {
    try {
      info.indicator.remove()
    } catch {}
  }

  delete HURT_ENTITIES[id]
})

system.runInterval(
  () => {
    const indicators = getIDs(getIndicators())
    const usedIndicators = new Set()
    const now = Date.now()

    for (const [id, info] of Object.entries(HURT_ENTITIES)) {
      const entity = info.hurtEntity

      if (!entity || (info.damage === 0 && info.expires < now)) {
        if (info.separated)
          try {
            info.indicator.remove()
          } catch {}

        delete HURT_ENTITIES[id]
        continue
      }

      if (info.separated) usedIndicators.add(info.indicator.id)
      updateIndicator({ entity, damage: -(info.damage / 2) })
    }

    for (const indicator of indicators) {
      if (!usedIndicators.has(indicator.id)) {
        try {
          indicator.entity.remove()
        } catch {}
      }
    }
  },
  'health indicator, damage reducer',
  20
)

const BAR_SYMBOL = '|'

/**
 * Gets damage indicator name depending on entity's currnet heart and damage applied
 * @param {Entity} entity
 * @returns {string}
 */
function getBar(entity, hp = entity.getComponent('health')) {
  if (!hp || !(entity.id in HURT_ENTITIES)) return ''
  const maxHP = hp.defaultValue

  const s = 50
  const scale = maxHP <= s ? 1 : maxHP / s

  const full = ~~(maxHP / scale)
  const current = ~~(hp.currentValue / scale)
  const damage = ~~(HURT_ENTITIES[entity.id].damage / scale)

  let bar = ''
  for (let i = 1; i <= full; i++) {
    if (i <= current) bar += '§c' + BAR_SYMBOL
    if (i > current && i <= current + damage) bar += '§e' + BAR_SYMBOL
    if (i > current + damage) bar += '§7' + BAR_SYMBOL
  }

  return bar
}

PLAYER_NAME_TAG_MODIFIERS.push(p => {
  const bar = getBar(p)
  if (bar) return '\n' + bar
  else return false
})

/**
 * @param {{entity: Entity, damage?: number, entityId?: string}} param0
 */
function updateIndicator({ entity, damage = 0, entityId = GAME_UTILS.safeGet(entity, 'id') }) {
  if (!entityId) return

  let info = HURT_ENTITIES[entityId]

  if (!info) {
    const separated = !ALWAYS_SHOWS.includes(entity.typeId)
    const base = {
      hurtEntity: entity,
      expires: Date.now() + util.ms.from('sec', 10),
      damage: 0,
    }

    if (separated) {
      info = {
        ...base,
        separated: true,
        indicator: spawnIndicator(entity),
      }
    } else {
      info = {
        ...base,
        separated: false,
      }
    }

    HURT_ENTITIES[entityId] = info
  }

  info.damage += damage

  setNameTag(info.separated ? info.indicator : info.hurtEntity, () => getBar(entity))
  if (info.separated) info.indicator.teleport(Vector.add(entity.getHeadLocation(), { x: 0, y: 1, z: 0 }))
}

/**
 * @param {Entity} entity
 */
function spawnIndicator(entity) {
  const indicator = entity.dimension.spawnEntity(CUSTOM_ENTITIES.floatingText, entity.getHeadLocation())
  indicator.addTag(INDICATOR_TAG)
  return indicator
}

function getIndicators() {
  return world.overworld.getEntities({
    type: CUSTOM_ENTITIES.floatingText,
    tags: [INDICATOR_TAG],
  })
}

/**
 * @param {Entity[]} entities
 */
function getIDs(entities) {
  return entities.map(
    entity =>
      /** @type {{id: string, entity: Entity}} */ ({
        id: GAME_UTILS.safeGet(entity, 'id'),
        entity,
      })
  )
}
