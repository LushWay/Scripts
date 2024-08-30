import { Entity, ItemStack, system, world } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { ms, Vector } from 'lib'
import { customItems } from 'modules/commands/getitem'
import { getEdgeBlocksOf } from 'modules/places/mineshaft/get-edge-blocks-of'
import { scheduleBlockPlace } from 'modules/survival/scheduled-block-place'
// TODO Make custom items and throw effects work properly
// TODO FIX ALL THAT BUGGED SHIT
// may use projectileComponent in 1.9.0-beta

// Snow bomb / Fireball
// world.afterEvents.itemUse.subscribe(data => {
//   if (!['lw:ice_bomb', 'lw:fireball'].includes(data.itemStack.typeId)) return

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

export const FireBallItem = new ItemStack('lw:fireball').setInfo(
  undefined,
  'Используйте, чтобы отправить все в огненный ад',
)
export const IceBombItem = new ItemStack(MinecraftItemTypes.Snowball).setInfo(
  '§3Снежная бомба\n§7(use)',
  'Используйте, чтобы отправить все к снежной королеве под льдину',
)

customItems.push(FireBallItem, IceBombItem)

world.afterEvents.dataDrivenEntityTrigger.subscribe(
  event => {
    if (!event.entity.isValid()) return
    if (event.entity.typeId !== 'lw:fireball') {
      return system.delay(() => {
        try {
          event.entity.remove()
        } catch {}
      })
    }

    const location = event.entity.location
    const dimension = event.entity.dimension
    system.delay(() => {
      if (event.entity.isValid()) event.entity.remove()
      dimension.createExplosion(location, 1, {
        causesFire: true,
        breaksBlocks: true,
      })
    })
  },
  {
    eventTypes: ['lw:explode'],
  },
)

const ICE_BOMB_TRANSOFORM: Record<string, string> = {
  [MinecraftBlockTypes.Water]: MinecraftBlockTypes.Ice,
  [MinecraftBlockTypes.FlowingWater]: MinecraftBlockTypes.Ice,
  [MinecraftBlockTypes.Lava]: MinecraftBlockTypes.Obsidian,
  [MinecraftBlockTypes.FlowingLava]: MinecraftBlockTypes.Stone,
}

// TODO Standartized onSpawnByPlayer event for entities like this
const iceBombs: Entity[] = []

world.afterEvents.itemUse.subscribe(event => {
  if (!event.itemStack.is(IceBombItem)) return

  const entity = event.source.dimension.getEntities({
    location: event.source.location,
    maxDistance: 3,
    type: MinecraftEntityTypes.Snowball,
  })[0]

  if (typeof entity !== 'undefined') iceBombs.push(entity)
})

system.runInterval(
  () => {
    for (const entity of iceBombs) {
      if (!entity.isValid()) continue

      const base = Vector.floor(entity.location)
      getEdgeBlocksOf(base)
        .concat(base)
        .forEach(e => {
          const block = entity.dimension.getBlock(e)
          const transform = block && block.typeId in ICE_BOMB_TRANSOFORM
          const water = block?.isWaterlogged
          if (transform || water) {
            scheduleBlockPlace({
              dimension: entity.dimension.type,
              location: block.location,
              typeId: block.typeId,
              states: block.permutation.getAllStates(),
              restoreTime: ms.from('min', 1),
            })

            if (transform) {
              block.setType(ICE_BOMB_TRANSOFORM[block.typeId])
            } else if (water) {
              block.setWaterlogged(false)
            }
          }
        })
    }
  },
  'ice bomb ice place',
  0,
)
