import { Entity, EntityComponentTypes, ItemStack, Player, system, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vector, ms } from 'lib'
import { customItems } from 'lib/rpg/custom-item'
import { scheduleBlockPlace } from 'lib/scheduled-block-place'
import { toPoint } from 'lib/utils/point'
import { WeakPlayerSet } from 'lib/weak-player-storage'
import { BaseRegion } from 'modules/places/base/region'
import { getEdgeBlocksOf } from 'modules/places/mineshaft/get-edge-blocks-of'

export const IceBombItem = new ItemStack(MinecraftItemTypes.Snowball).setInfo(
  '§3Снежная бомба',
  'Используйте, чтобы отправить все к снежной королеве подо льдину',
)
customItems.push(IceBombItem)

const ICE_BOMB_TRANSOFORM: Record<string, string> = {
  [MinecraftBlockTypes.Water]: MinecraftBlockTypes.FrostedIce,
  [MinecraftBlockTypes.FlowingWater]: MinecraftBlockTypes.Ice,
  [MinecraftBlockTypes.Lava]: MinecraftBlockTypes.Obsidian,
  [MinecraftBlockTypes.FlowingLava]: MinecraftBlockTypes.Stone,
}

const iceBombs = new Set<Entity>()
const usedIceBombs = new WeakPlayerSet()

world.afterEvents.itemUse.subscribe(event => {
  if (!event.itemStack.is(IceBombItem)) return
  usedIceBombs.add(event.source)
})

world.afterEvents.entitySpawn.subscribe(event => {
  if (!event.entity.isValid) return
  if (event.entity.typeId !== MinecraftEntityTypes.Snowball) return

  const projectile = event.entity.getComponent(EntityComponentTypes.Projectile)
  if (!(projectile?.owner instanceof Player)) return

  if (!usedIceBombs.has(projectile.owner)) return

  usedIceBombs.delete(projectile.owner)
  iceBombs.add(event.entity)
})

system.runInterval(
  () => {
    for (const entity of iceBombs) {
      if (!entity.isValid) {
        iceBombs.delete(entity)
        continue
      }

      const floored = Vector.floor(entity.location)
      const dimension = entity.dimension
      const dimensionType = dimension.type

      for (const vector of getEdgeBlocksOf(floored).concat(floored)) {
        const point = toPoint({ vector, dimensionType })
        const baseRegions = BaseRegion.getNear(point, 6)
        if (!baseRegions.length) continue

        const inRegion = baseRegions.some(e => e.area.isIn(point))
        const block = dimension.getBlock(vector)
        const transform = block && ICE_BOMB_TRANSOFORM[block.typeId]
        const water = block?.isWaterlogged
        if (!(transform || water)) continue

        if (!inRegion) {
          scheduleBlockPlace({
            dimension: dimensionType,
            location: vector,
            typeId: block.typeId,
            states: block.permutation.getAllStates(),
            restoreTime: ms.from('min', 5),
          })
        }

        if (transform) {
          block.setType(transform)
        } else if (water) {
          block.setWaterlogged(false)
        }
      }
    }
  },
  'ice bomb ice place',
  0,
)
