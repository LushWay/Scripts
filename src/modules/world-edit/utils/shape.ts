import { BlockPermutation, Player, system } from '@minecraft/server'
import { util, Vector } from 'lib'
import { stringifyReplaceTargets, toReplaceTarget } from 'modules/world-edit/menu'
import { ShapeFormula, SHAPES } from 'modules/world-edit/utils/shapes'
import { WE_CONFIG } from '../config'
import { Cuboid } from '../lib/cuboid'
import { WorldEdit } from '../lib/world-edit'

/**
 * @param player
 * @param shape Shape equation to caculate
 * @param pos Location to generate shape
 * @param blocks Blocks to use to fill block
 * @param replaceBlocks
 * @param rad Size of sphere
 */
export function placeShape(
  player: Player,
  shapeName: keyof typeof SHAPES,
  pos: Vector3,
  rad: number,
  blocks: BlockPermutation[],
  replaceBlocks: (import('modules/world-edit/menu').ReplaceTarget | undefined)[] = [undefined],
): string | undefined {
  if (replaceBlocks.length < 1) replaceBlocks.push(undefined)
  if (blocks.length < 1) return '§cПустой набор блоков'
  util.catch(async () => {
    const loc1 = { x: -rad, y: -rad, z: -rad }
    const loc2 = { x: rad, z: rad, y: rad }

    WorldEdit.forPlayer(player).backup(
      `§3Кисть §6${shapeName}§3, размер §f${rad}§3, блоки: §f${stringifyReplaceTargets(blocks.map(toReplaceTarget))}`,
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
      const location = Vector.add(pos, { x, y, z })
      const block = player.dimension.getBlock(location)
      for (const replaceBlock of replaceBlocks) {
        if (replaceBlock && !block?.permutation.matches(replaceBlock.typeId, replaceBlock.states)) continue

        block?.setPermutation(blocks.randomElement())

        blocksSet++

        if (blocksSet >= WE_CONFIG.BLOCKS_BEFORE_AWAIT) {
          await system.sleep(WE_CONFIG.TICKS_TO_SLEEP)
          blocksSet = 0
        }
      }
    }
  })
}
