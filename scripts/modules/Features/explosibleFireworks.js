import { Entity, Player, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'

/** @type {Record<string, { date: number; entity: Entity }>} */
const SPAWNED_FIREWORKS = {}
world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity.isValid()) return
  if (entity.typeId !== MinecraftEntityTypes.FireworksRocket) return

  SPAWNED_FIREWORKS[entity.id] = { date: Date.now(), entity }
})

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId !== MinecraftItemTypes.Crossbow) return
  if (!(event.source instanceof Player) || !event.source.isValid()) return

  for (const [id, { date, entity }] of Object.entries(SPAWNED_FIREWORKS)) {
    if (!entity.isValid()) continue
    if (Date.now() - date < 5 && Vector.distance(event.source.location, entity.location) < 2) {
      delete SPAWNED_FIREWORKS[id]
      FIREWORKS[id] = { source: event.source, firework: entity }
      break
    }
  }
})

/** @type {Record<string, { source: Player; firework: Entity }>} */
const FIREWORKS = {}

system.runInterval(
  () => {
    for (const [id, { date }] of Object.entries(SPAWNED_FIREWORKS)) {
      if (Date.now() - date > 5) delete SPAWNED_FIREWORKS[id]
    }

    for (const [id, { source, firework }] of Object.entries(FIREWORKS)) {
      if (!firework.isValid()) {
        delete FIREWORKS[id]
        continue
      }

      const location = firework.location
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
  0,
)
