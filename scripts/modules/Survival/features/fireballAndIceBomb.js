import { Vector, system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { scheduleBlockPlace } from 'modules/Survival/utils/scheduledBlockPlace.js'
import { GAME_UTILS, util } from 'smapi.js'
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

/**
 * @type {Record<string, string>}
 */
const ICE_BOMB_TRANSOFORM = {
  [MinecraftBlockTypes.Water]: MinecraftBlockTypes.Ice,
  [MinecraftBlockTypes.FlowingWater]: MinecraftBlockTypes.Ice,
  [MinecraftBlockTypes.Lava]: MinecraftBlockTypes.Obsidian,
  [MinecraftBlockTypes.FlowingLava]: MinecraftBlockTypes.Stone,
}

system.runInterval(
  () => {
    world.overworld.getEntities({ type: 'minecraft:snowball' }).forEach(entity => {
      const block = entity.dimension.getBlock(entity.location)
      if (block) {
        if (block.typeId in ICE_BOMB_TRANSOFORM) {
          scheduleBlockPlace({
            dimension: entity.dimension.type,
            location: block.location,
            typeId: block.typeId,
            states: block.permutation.getAllStates(),
            restoreTime: util.ms.from('min', 1),
          })

          block.setType(ICE_BOMB_TRANSOFORM[block.typeId])
          entity.remove()
        }
      }
    })
  },
  'ice bomb ice place',
  0
)
