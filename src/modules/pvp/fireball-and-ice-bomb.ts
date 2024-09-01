import { Entity, ItemStack, system, world } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Region, Vector } from 'lib'
import { customItems } from 'modules/commands/getitem'
import { BaseRegion } from 'modules/places/base/region'
import { getEdgeBlocksOf } from 'modules/places/mineshaft/get-edge-blocks-of'

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
  [MinecraftBlockTypes.Water]: MinecraftBlockTypes.FrostedIce,
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
      const dimension = entity.dimension
      getEdgeBlocksOf(base)
        .concat(base)
        .forEach(e => {
          const regions = Region.nearestRegions(e, dimension.type)
          if (!regions.some(e => e instanceof BaseRegion)) return

          const block = dimension.getBlock(e)
          const transform = block && block.typeId in ICE_BOMB_TRANSOFORM
          const water = block?.isWaterlogged
          if (transform || water) {
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
