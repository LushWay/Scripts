import { Block, Dimension, Player } from '@minecraft/server'
import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { Vector } from 'lib'
import { Ore, OreCollector } from './ore-collector'

export const ores = new OreCollector(
  new Ore().type(b.CoalOre).deepslate(b.CoalOre).chance(3),
  new Ore().type(b.CopperOre).deepslate(b.DeepslateCopperOre).chance(2),
  new Ore()
    .type(b.RedstoneOre)
    .deepslate(b.DeepslateRedstoneOre)
    .type(b.LitRedstoneOre)
    .deepslate(b.LitDeepslateRedstoneOre)
    .chance(1),

  new Ore().type(b.LapisOre).deepslate(b.DeepslateLapisOre).chance(0.1),
  new Ore().type(b.IronOre).deepslate(b.DeepslateIronOre).chance(2),
  new Ore().type(b.GoldOre).deepslate(b.DeepslateGoldOre).chance(0.5),
  new Ore().type(b.DiamondOre).deepslate(b.DeepslateDiamondOre).chance(0.1),
  new Ore().type(b.EmeraldOre).deepslate(b.DeepslateEmeraldOre).chance(0.1),
).stoneChance(90)

export function placeOre(brokenBlock: Block, dimension: Dimension, player: Player) {
  const possibleBlocks = []
  const airCache: Record<string, boolean> = { [Vector.string(brokenBlock)]: false }

  for (const vector of getEdgeBlocksOf(brokenBlock)) {
    const block = dimension.getBlock(vector)
    if (!block || block.isAir) continue

    const nearAir = getEdgeBlocksOf(vector).find(e => (airCache[Vector.string(e)] ??= !!dimension.getBlock(e)?.isAir))

    if (nearAir) continue
    possibleBlocks.push(block)
  }

  const block = possibleBlocks.randomElement()
  if (block.isValid() && !block.isAir) {
    const isDeepslate = block.typeId === b.Deepslate
    const oreTypeId = ores.selectOreByChance(isDeepslate)
    if (oreTypeId) block.setType(oreTypeId)
  }
}

/**
 * @example
 *   ```
 *   y=-1
 *   x/z -1 0 1
 *   -1
 *   +0     X
 *   +1
 *
 *   y=0
 *   x/z -1 0 1
 *   -1     X
 *   +0   X   X
 *   +1     X
 *
 *   y=1
 *   x/z -1 0 1
 *   -1
 *   +0     X
 *   +1
 *   ```
 */
export const getEdgeBlocksOf = (base: Vector3) =>
  [
    { x: 0, z: 0, y: -1 },
    { x: -1, z: 0, y: 0 },
    { x: 0, z: -1, y: 0 },
    { x: 0, z: 1, y: 0 },
    { x: 1, z: 0, y: 0 },
    { x: 0, z: 0, y: 1 },
  ].map(e => Vector.add(base, e))
