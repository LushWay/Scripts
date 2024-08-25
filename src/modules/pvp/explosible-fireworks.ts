import { Entity, EntityDamageCause, Player, system, world } from '@minecraft/server'
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
      return
    }
  }

  console.log('UNDETECTED')
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
      const b4 = firework.dimension.getBlock(firework.location)
      const b2 = firework.getBlockFromViewDirection({ maxDistance: 1 })

      if ((block && !block.isAir) || b2 || (b4 && !b4.isAir)) {
        firework.dimension.createExplosion(location, 1.6, {
          source,
          breaksBlocks: true,
        })
        const entities = firework.dimension.getEntities({ location: firework.location, maxDistance: 4 })
        for (const entity of entities) {
          entity.applyDamage(5, {
            cause: EntityDamageCause.entityExplosion,
            damagingEntity: source,
            damagingProjectile: firework,
          })
        }
        firework.remove()
        FIREWORKS.delete(id)
      }
    }
  },
  'firework boom',
  0,
)
