import { BlockPermutation, Player, system } from '@minecraft/server'
import { util, Vector } from 'lib'
import { ShapeFormula, SHAPES } from 'modules/world-edit/utils/shapes'
import { WE_CONFIG } from '../config'
import { Cuboid } from '../lib/cuboid'
import { WorldEdit } from '../lib/world-edit'
import { ReplaceTarget, replaceWithTargets, stringifyBlockWeights, toReplaceTarget } from './blocks-set'

/**
 * @param player
 * @param shape Shape equation to caculate
 * @param pos Location to generate shape
 * @param permutations Blocks to use to fill block
 * @param replaceTargets
 * @param rad Size of sphere
 */
export function placeShape(
  player: Player,
  shapeName: keyof typeof SHAPES,
  pos: Vector3,
  rad: number,
  permutations: BlockPermutation[],
  replaceTargets: ReplaceTarget[],
): string | undefined {
  if (permutations.length < 1) return '§cПустой набор блоков'
  util.catch(async () => {
    const loc1 = { x: -rad, y: -rad, z: -rad }
    const loc2 = { x: rad, z: rad, y: rad }

    WorldEdit.forPlayer(player).backup(
      `§3Кисть §6${shapeName}§3, размер §f${rad}§3, блоки: §f${stringifyBlockWeights(permutations.map(toReplaceTarget))}`,
      Vector.add(pos, loc1),
      Vector.add(pos, loc2),
    )

    const shape = SHAPES[shapeName]
    const cuboid = new Cuboid(loc1, loc2)

    let blocksSet = 0
    for (const { x, y, z } of Vector.foreach(loc1, loc2)) {
      const condition = shape(
        Object.setPrototypeOf(
          { rad, x, y, z } satisfies Omit<Parameters<ShapeFormula>[0], keyof Cuboid>,
          cuboid,
        ) as Parameters<ShapeFormula>[0],
      )
      if (!condition) continue

      const block = player.dimension.getBlock(Vector.add(pos, { x, y, z }))
      if (!block) continue

      replaceWithTargets(replaceTargets, block, permutations)
      blocksSet++

      if (blocksSet >= WE_CONFIG.BLOCKS_BEFORE_AWAIT) {
        await system.sleep(WE_CONFIG.TICKS_TO_SLEEP)
        blocksSet = 0
      }
    }
  })
}
