import { Entity, EntityDamageCause, ExplosionOptions, Player, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib'
import { getEdgeBlocksOf } from 'modules/places/mineshaft/get-edge-blocks-of'
import { createBlockExplosionChecker } from './raid'

export interface ExplosibleEntityOptions extends Omit<ExplosionOptions, 'source'> {
  strength: number
  damage: number
  customBlocksToBreak?: string[]
  r?: boolean
}

interface ExplosibleEntity {
  source: Player
  entity: Entity
  explosion: ExplosibleEntityOptions
}

export const explosibleEntities = new Set<ExplosibleEntity>()

system.runInterval(
  () => {
    for (const explosibleEntity of explosibleEntities) {
      const { source, entity, explosion } = explosibleEntity
      if (!entity.isValid) {
        explosibleEntities.delete(explosibleEntity)
        continue
      }

      const location = entity.location
      const viewBlock = entity.dimension.getBlock(Vec.add(location, Vec.multiply(entity.getViewDirection(), 1.2)))
      const entityLocationBlocks = isEntityInBlock(entity, explosion.r)
      const ray = entity.getBlockFromViewDirection({ maxDistance: 1, includePassableBlocks: false })

      if (ray || viewBlock?.isSolid || entityLocationBlocks) {
        createExplosionFromOptions(explosion, entity, source, location)
        createDamageFromOptions(explosion, entity, source)
        breakCustomBlocksFromOptions(explosion, entity, location, source)
        entity.remove()
        explosibleEntities.delete(explosibleEntity)
      }
    }
  },
  'explosible entities',
  0,
)

function isEntityInBlock(entity: Entity, r = false) {
  const isSolid = entity.dimension.getBlock(entity.location)?.isSolid

  if (isSolid) return true
  if (!r) return false

  for (const vector of getEdgeBlocksOf(entity.location)) {
    const block = entity.dimension.getBlock(vector)
    if (block?.isSolid) return true
  }
}

function createDamageFromOptions(explosion: ExplosibleEntityOptions, entity: Entity, source: Player) {
  if (explosion.damage) {
    const entities = entity.dimension.getEntities({ location: entity.location, maxDistance: 4 })
    for (const entity of entities) {
      entity.applyDamage(explosion.damage, {
        cause: EntityDamageCause.entityExplosion,
        damagingEntity: source,
        damagingProjectile: entity,
      })
    }
  }
}

function breakCustomBlocksFromOptions(
  explosion: ExplosibleEntityOptions,
  entity: Entity,
  location = entity.location,
  player: Player,
) {
  if (!explosion.customBlocksToBreak?.length) return

  const checker = createBlockExplosionChecker()
  const vectors = getEdgeBlocksOf(location)
  let exploded = false
  for (const vector of vectors) {
    console.log({ vector, exploded })
    if (Math.random() < 0.2) continue // 20% chance to skip

    const block = entity.dimension.getBlock(vector)
    if (!block || block.isAir) continue
    if (!explosion.customBlocksToBreak.includes(block.typeId)) continue
    if (!checker.canBlockExplode(block)) continue

    exploded = true
    block.setType(MinecraftBlockTypes.Air)
  }

  if (exploded) checker.raidLock(player)
}

export function createExplosionFromOptions(
  options: ExplosibleEntityOptions,
  entity: Entity,
  source: Player,
  location = entity.location,
) {
  entity.dimension.createExplosion(location, options.strength, {
    source,
    ...options,
  })
}
