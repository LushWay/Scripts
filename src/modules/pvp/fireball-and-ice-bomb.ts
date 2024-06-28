import { Entity, ItemStack, system, world } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { ms } from 'lib'
import { scheduleBlockPlace } from 'modules/survival/scheduled-block-place'
// TODO Make custom items and throw effects work properly
// TODO FIX ALL THAT BUGGED SHIT
// may use projectileComponent in 1.9.0-beta

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

export const FireBallItem = new ItemStack('sm:fireball').setInfo(
  '§4Огненный шар\n§7(use)',
  'Используйте, чтобы отправить все в огненный ад',
)
export const IceBombItem = new ItemStack(MinecraftItemTypes.Snowball).setInfo(
  '§3Снежная бомба\n§7(use)',
  'Используйте, чтобы отправить все к снежной королеве под льдину',
)

world.afterEvents.dataDrivenEntityTrigger.subscribe(
  event => {
    if (!event.entity.isValid()) return
    if (event.entity.typeId !== 'sm:fireball') {
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
    eventTypes: ['sm:explode'],
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

      const block = entity.dimension.getBlock(entity.location)
      if (block && block.typeId in ICE_BOMB_TRANSOFORM) {
        scheduleBlockPlace({
          dimension: entity.dimension.type,
          location: block.location,
          typeId: block.typeId,
          states: block.permutation.getAllStates(),
          restoreTime: ms.from('min', 1),
        })

        block.setType(ICE_BOMB_TRANSOFORM[block.typeId])
        entity.remove()
      }
    }
  },
  'ice bomb ice place',
  0,
)
