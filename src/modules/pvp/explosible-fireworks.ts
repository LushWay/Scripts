import { Entity, Player, system, world } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vector } from 'lib'

const SPAWNED_FIREWORKS = new Map<string, { date: number; entity: Entity }>()

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity.isValid()) return
  if (entity.typeId !== MinecraftEntityTypes.FireworksRocket) return

  SPAWNED_FIREWORKS.set(entity.id, { date: Date.now(), entity })
})

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId !== MinecraftItemTypes.Crossbow) return
  if (!(event.source instanceof Player) || !event.source.isValid()) return

  for (const [id, { date, entity }] of SPAWNED_FIREWORKS.entries()) {
    if (!entity.isValid()) continue
    if (Date.now() - date < 5 && Vector.distance(event.source.location, entity.location) < 2) {
      SPAWNED_FIREWORKS.delete(id)
      FIREWORKS.set(id, { source: event.source, firework: entity })
      break
    }
  }
})

const FIREWORKS = new Map<string, { source: Player; firework: Entity }>()

system.runInterval(
  () => {
    for (const [id, { date }] of SPAWNED_FIREWORKS) {
      if (Date.now() - date > 5) SPAWNED_FIREWORKS.delete(id)
    }

    for (const [id, { source, firework }] of FIREWORKS.entries()) {
      if (!firework.isValid()) {
        FIREWORKS.delete(id)
        continue
      }

      const location = firework.location
      const block = firework.dimension.getBlock(Vector.add(location, Vector.multiply(firework.getViewDirection(), 1.2)))

      if (block && !block.isAir) {
        firework.dimension.createExplosion(location, 0.8 * 2, {
          source,
          breaksBlocks: true,
        })
        FIREWORKS.delete(id)
      }
    }
  },
  'firework boom',
  0,
)
