import { Entity, Player, system, world } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib'
import { explosibleEntities, ExplosibleEntityOptions } from './explosible-entities'

const fireworks = new Set<{ date: number; entity: Entity }>()

const fireworkExplosionOptions: ExplosibleEntityOptions = {
  damage: 5,
  strength: 1.5,
  breaksBlocks: true,
}

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity.isValid) return
  if (entity.typeId !== MinecraftEntityTypes.FireworksRocket) return

  fireworks.add({ date: Date.now(), entity })
})

world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId !== MinecraftItemTypes.Crossbow) return
  if (!(event.source instanceof Player) || !event.source.isValid) return

  for (const firework of fireworks) {
    if (!firework.entity.isValid) continue
    if (Date.now() - firework.date < 5 && Vec.distance(event.source.location, firework.entity.location) < 2) {
      fireworks.delete(firework)
      console.log(firework.entity.id)
      explosibleEntities.add({ source: event.source, entity: firework.entity, explosion: fireworkExplosionOptions })
      return
    }
  }
})

system.runInterval(
  () => {
    for (const firework of fireworks) {
      if (Date.now() - firework.date > 5) fireworks.delete(firework)
    }
  },
  'firework boom',
  10,
)
