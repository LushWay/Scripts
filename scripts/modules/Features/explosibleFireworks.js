import { Entity, Player, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { GAME_UTILS } from 'lib.js'

/**
 * @type {Record<string, { date: number, entity: Entity }>}
 */
const SPAWNED_FIREWORKS = {}
world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  const typeId = GAME_UTILS.safeGet(entity, 'typeId')
  if (typeId !== MinecraftEntityTypes.FireworksRocket) return

  SPAWNED_FIREWORKS[entity.id] = { date: Date.now(), entity }
})

world.afterEvents.itemUse.subscribe(data => {
  if (data.itemStack.typeId !== MinecraftItemTypes.Crossbow) return
  if (!(data.source instanceof Player)) return

  for (const [id, { date, entity }] of Object.entries(SPAWNED_FIREWORKS)) {
    if (Date.now() - date < 5 && Vector.distance(data.source.location, entity.location) < 2) {
      delete SPAWNED_FIREWORKS[id]
      FIREWORKS[id] = { source: data.source, firework: entity }
      break
    }
  }
})

/**
 * @type {Record<string, { source: Player, firework: Entity }>}
 */
const FIREWORKS = {}

system.runInterval(
  () => {
    for (const [id, { date }] of Object.entries(SPAWNED_FIREWORKS)) {
      if (Date.now() - date > 5) delete SPAWNED_FIREWORKS[id]
    }

    for (const [id, { source, firework }] of Object.entries(FIREWORKS)) {
      const location = GAME_UTILS.safeGet(firework, 'location')
      if (!location) {
        console.debug({ location })
        delete FIREWORKS[id]
        continue
      }

      const block = firework.dimension.getBlock(Vector.add(location, Vector.multiply(firework.getViewDirection(), 1.2)))

      if (block && !block.isAir) {
        firework.dimension.createExplosion(location, 0.8 * 2, {
          source,
          breaksBlocks: true,
        })
        delete FIREWORKS[id]
      }
    }
  },
  'firework boom',
  0
)
