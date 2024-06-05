import { Block, Dimension } from '@minecraft/server'
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

export function placeOre(block: Block, dimension: Dimension) {
  const possibleOreBlocks = []
  const airCache: Record<string, boolean> = { [Vector.string(block)]: false }
  for (const vector of edgeBlockRelativeTo(block)) {
    const oreBlock = dimension.getBlock(vector)
    if (!oreBlock || oreBlock.isAir) continue

    const nearAir = edgeBlockRelativeTo(oreBlock).find(
      e => (airCache[Vector.string(e)] ??= !!dimension.getBlock(e)?.isAir),
    )

    if (nearAir) continue
    possibleOreBlocks.push(oreBlock)
  }
  const oreBlock = possibleOreBlocks.randomElement()
  if ((oreBlock as Block | undefined) && !oreBlock.isAir) {
    const oreTypeId = ores.selectOreByChance(oreBlock.typeId === b.Deepslate)
    if (oreTypeId) oreBlock.setType(oreTypeId)
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
export const edgeBlockRelativeTo = (base: Vector3) =>
  [
    { x: 0, z: 0, y: -1 },
    { x: -1, z: 0, y: 0 },
    { x: 0, z: -1, y: 0 },
    { x: 0, z: 1, y: 0 },
    { x: 1, z: 0, y: 0 },
    { x: 0, z: 0, y: 1 },
  ].map(e => Vector.add(base, e))
