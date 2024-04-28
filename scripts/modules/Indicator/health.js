import { Entity, Player, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { CUSTOM_ENTITIES } from 'config.js'
import { util } from 'lib.js'
import { CLOSING_CHAT } from 'lib/Extensions/player.js'
import { NOT_MOB_ENTITIES } from 'lib/Region/config'
import { PLAYER_NAME_TAG_MODIFIERS, setNameTag } from 'modules/Indicator/playerNameTag.js'
import { isBuilding } from 'modules/WorldEdit/isBuilding'

/**
 * @type {Record<
 *   string,
 *   (
 *     | {
 *         separated: false
 *       }
 *     | {
 *         separated: true
 *         indicator: Entity
 *       }
 *   ) & {
 *     hurtEntity: Entity
 *     damage: number
 *     expires: number
 *   }
 * >}
 */
const HURT_ENTITIES = {}
const INDICATOR_TAG = 'HEALTH_INDICATOR'

/**
 * Entities that have nameTag "always_show": true and dont have boss_bar
 *
 * @type {string[]}
 */
const ALWAYS_SHOWS = [MinecraftEntityTypes.Player]

/** List of families to indicate health */
const ALLOWED_FAMILIES = ['monster']

// Show indicator on hurt
world.afterEvents.entityHurt.subscribe(event => {
  if (event.damage === 0) return

  // Validate entity
  if (!event.hurtEntity.isValid()) return

  const { id } = event.hurtEntity
  if (!id || NOT_MOB_ENTITIES.includes(id)) return
  if (
    !event.hurtEntity.isValid() ||
    !(event.hurtEntity.matches({ families: ALLOWED_FAMILIES }) || event.hurtEntity instanceof Player)
  )
    return

  // Not trigget by close chat
  if (CLOSING_CHAT.has(event.hurtEntity.id)) return

  updateIndicator({ entity: event.hurtEntity, damage: Math.floor(event.damage) })
})

// Remove indicator
world.afterEvents.entityDie.subscribe(event => {
  if (!event.deadEntity.isValid()) return

  const { id } = event.deadEntity
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
      updateIndicator({ entity, damage: -info.damage })
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
  10,
)

const BAR_SYMBOL = '|'

/**
 * Gets damage indicator name depending on entity's currnet heart and damage applied
 *
 * @param {Entity} entity
 * @returns {string}
 */
function getBar(entity, hp = entity.getComponent('health')) {
  if (entity instanceof Player && isBuilding(entity)) return ''
  if (!hp || !(entity.id in HURT_ENTITIES)) return ''
  const maxHP = hp.defaultValue

  const s = 50
  const scale = maxHP <= s ? 1 : maxHP / s

  const full = ~~(maxHP / scale)
  const current = ~~(hp.currentValue / scale)
  const damage = ~~(HURT_ENTITIES[entity.id].damage / scale)

  let bar = ''
  for (let i = 1; i <= full; i++) {
    if (i <= current) {
      bar += '§c' + BAR_SYMBOL
      continue
    }
    if (i > current && i <= current + damage) {
      bar += '§e' + BAR_SYMBOL
      continue
    }

    bar += '§7' + BAR_SYMBOL
  }

  return bar
}

PLAYER_NAME_TAG_MODIFIERS.push(p => {
  const bar = getBar(p)
  if (bar) return '\n' + bar
  else return false
})

/** @param {{ entity: Entity; damage?: number; entityId?: string }} param0 */
function updateIndicator({ entity, damage = 0, entityId }) {
  if (entity.isValid()) return
  entityId ??= entity.id

  let info = HURT_ENTITIES[entityId]

  if (!info) {
    const separated = !ALWAYS_SHOWS.includes(entity.typeId)
    const base = {
      hurtEntity: entity,
      expires: Date.now(),
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

  if (damage > 0) {
    info.expires = Date.now() + util.ms.from('sec', 10)
  }

  info.damage += damage
  // Do not allow values below 0
  info.damage = Math.max(0, info.damage)

  try {
    setNameTag(info.separated ? info.indicator : info.hurtEntity, () => getBar(entity))
  } catch (e) {
    if (e instanceof Error && e.message.match(/Failed to (set|get) property/)) {
      delete HURT_ENTITIES[entityId]
      return
    }

    throw e
  }
  if (info.separated)
    try {
      info.indicator.teleport(Vector.add(entity.getHeadLocation(), { x: 0, y: 1, z: 0 }))
    } catch (e) {
      if (e instanceof Error && e.message.includes("Failed to call function 'getHeadLocation'")) {
        try {
          info.indicator.remove()
        } catch {}
        delete HURT_ENTITIES[entityId]
      }
    }
}

/** @param {Entity} entity */
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

/** @param {Entity[]} entities */
function getIDs(entities) {
  return entities.map(entity => ({
    id: util.run(() => entity.id)[0],
    entity,
  }))
}
