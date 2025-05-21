import { Entity, EntityDamageCause, Player, system, world } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vector } from 'lib'

const SPAWNED_FIREWORKS = new Map<string, { date: number; entity: Entity }>()

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity.isValid) return
  if (entity.typeId !== MinecraftEntityTypes.FireworksRocket) return

  SPAWNED_FIREWORKS.set(entity.id, { date: Date.now(), entity })
})

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId !== MinecraftItemTypes.Crossbow) return
  if (!(event.source instanceof Player) || !event.source.isValid) return

  for (const [id, { date, entity }] of SPAWNED_FIREWORKS.entries()) {
    if (!entity.isValid) continue
    if (Date.now() - date < 5 && Vector.distance(event.source.location, entity.location) < 2) {
      SPAWNED_FIREWORKS.delete(id)
      explosibleEntities.set(id, { source: event.source, entity: entity })
      return
    }
  }
})

export const explosibleEntities = new Map<string, { source: Player; entity: Entity }>()

system.runInterval(
  () => {
    for (const [id, { date }] of SPAWNED_FIREWORKS) {
      if (Date.now() - date > 5) SPAWNED_FIREWORKS.delete(id)
    }

    for (const [id, { source, entity }] of explosibleEntities.entries()) {
      if (!entity.isValid) {
        explosibleEntities.delete(id)
        continue
      }

      const location = entity.location
      const block = entity.dimension.getBlock(Vector.add(location, Vector.multiply(entity.getViewDirection(), 1.2)))
      const b4 = entity.dimension.getBlock(entity.location)
      const b2 = entity.getBlockFromViewDirection({ maxDistance: 1 })

      if ((block && !block.isAir) || b2 || (b4 && !b4.isAir)) {
        entity.dimension.createExplosion(location, 1.6, {
          source,
          breaksBlocks: true,
        })
        const entities = entity.dimension.getEntities({ location: entity.location, maxDistance: 4 })
        for (const entity of entities) {
          entity.applyDamage(5, {
            cause: EntityDamageCause.entityExplosion,
            damagingEntity: source,
            damagingProjectile: entity,
          })
        }
        entity.remove()
        explosibleEntities.delete(id)
      }
    }
  },
  'firework boom',
  0,
)
