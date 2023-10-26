import { Entity, Player, Vector, system, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { GameUtils } from 'xapi.js'
/** @type {Record<string, [number, Entity]>} */
const SPAWNED_FIREWORKS = {}

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (GameUtils.safeGetTypeID(entity) !== 'minecraft:firework_rocket') return
  SPAWNED_FIREWORKS[entity.id] = [Date.now(), entity]
})

world.afterEvents.itemUse.subscribe(data => {
  if (data.itemStack.typeId !== MinecraftItemTypes.Crossbow) return
  if (!(data.source instanceof Player)) return

  for (const [id, [date, entity]] of Object.entries(SPAWNED_FIREWORKS)) {
    if (
      Date.now() - date < 5 &&
      Vector.distance(data.source.location, entity.location) < 2
    ) {
      delete SPAWNED_FIREWORKS[id]
      FIREWORKS[id] = { source: data.source, firework: entity }
      break
    }
  }
})

/** @type {Record<string, {source: Player, firework: Entity}>} */
const FIREWORKS = {}

system.runInterval(
  () => {
    for (const [id, { source, firework }] of Object.entries(FIREWORKS)) {
      let velocity
      try {
        velocity = Vector.floor(firework.getVelocity())
      } catch (e) {
        delete FIREWORKS[id]
        continue
      }

      const block = firework.dimension.getBlock(
        Vector.add(firework.location, firework.getViewDirection())
      )

      if (block && !block.isAir) {
        firework.dimension.createExplosion(firework.location, 0.8, {
          source,
          breaksBlocks: true,
        })
        delete FIREWORKS[id]
      }
    }
  },
  'firework boom',
  10
)
