import { Entity, Player, Vector, system, world } from '@minecraft/server'
import {
  MinecraftBlockTypes,
  MinecraftEntityTypes,
  MinecraftItemTypes,
} from '@minecraft/vanilla-data.js'
import { GAME_UTILS } from 'smapi.js'
/** @type {Record<string, { date: number, entity: Entity }>} */
const SPAWNED_FIREWORKS = {}

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  const typeId = GAME_UTILS.safeGet(entity, 'typeId')
  if (typeId !== `minecraft:fireworks_rocket`) return

  SPAWNED_FIREWORKS[entity.id] = { date: Date.now(), entity }
})

world.afterEvents.itemUse.subscribe(data => {
  if (data.itemStack.typeId !== MinecraftItemTypes.Crossbow) return
  if (!(data.source instanceof Player)) return

  for (const [id, { date, entity }] of Object.entries(SPAWNED_FIREWORKS)) {
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

/** @type {Record<string, { source: Player, firework: Entity }>} */
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

      const block = firework.dimension.getBlock(
        Vector.add(location, Vector.multiply(firework.getViewDirection(), 1.2))
      )

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

// Bouncy tnt
world.beforeEvents.itemUse.subscribe(data => {
  if (data.itemStack.typeId !== MinecraftItemTypes.Tnt) return
  data.cancel = true

  system.delay(() => {
    if (!(data.source instanceof Player)) return

    const tnt = data.source.dimension.spawnEntity(
      MinecraftEntityTypes.Tnt,
      data.source.location
    )
    const tntSlot = data.source.mainhand()

    if (tntSlot.amount === 1) tntSlot.setItem(undefined)
    else tntSlot.amount--

    tnt.applyImpulse(data.source.getViewDirection())
    data.source.playSound('camera.take_picture', { volume: 4, pitch: 0.9 })
  })
})

// Snow bomb / Fireball
// world.afterEvents.itemUse.subscribe(data => {
//   if (!['sm:ice_bomb', 'sm:fireball'].includes(data.itemStack.typeId)) return

//   system.delay(() => {
//     if (!(data.source instanceof Player)) return

//     const item = data.source.dimension.spawnEntity(
//       data.itemStack.typeId,
//       data.source.location
//     )
//     const itemSlot = data.source.mainhand()

//     if (itemSlot.amount === 1) itemSlot.setItem(undefined)
//     else itemSlot.amount--

//     item.applyImpulse(Vector.multiply(data.source.getViewDirection(), 1.5))
//     data.source.playSound('camera.take_picture', { volume: 4, pitch: 0.9 })
//   })
// })

world.beforeEvents.dataDrivenEntityTriggerEvent.subscribe(
  event => {
    const typeId = GAME_UTILS.safeGet(event.entity, 'typeId')
    if (typeId !== 'sm:fireball')
      return system.delay(() => {
        try {
          event.entity.remove()
        } catch {}
      })
    event.cancel = true

    const location = event.entity.location
    const dimension = event.entity.dimension
    system.delay(() => {
      event.entity.teleport(Vector.zero)
      event.entity.remove()
      dimension.createExplosion(location, 1, {
        causesFire: true,
        breaksBlocks: true,
      })
    })
  },
  {
    eventTypes: ['sm:explode'],
  }
)

system.runInterval(
  () => {
    world.overworld.getEntities({ type: 'sm:ice_bomb' }).forEach(entity => {
      const block = entity.dimension.getBlock(entity.location)
      if (block?.typeId === MinecraftBlockTypes.Water) {
        block.setType(MinecraftBlockTypes.Ice)
        entity.remove()
      }
    })
  },
  'ice bomb ice place',
  0
)
