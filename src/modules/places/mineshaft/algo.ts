import { Block, Dimension, Player } from '@minecraft/server'
import { MinecraftBlockTypes as b, MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vector } from 'lib'
import { EventSignal } from 'lib/event-signal'
import { MineshaftRegion } from './mineshaft-region'
import { Ore, OreCollector, OreEntry } from './ore-collector'

export const ores = new OreCollector(
  new Ore().type(b.CoalOre).deepslate(b.DeepslateCoalOre).groupChance(90).chance(3),
  new Ore().type(b.CopperOre).deepslate(b.DeepslateCopperOre).groupChance(90).chance(2),
  new Ore()
    .type(b.RedstoneOre)
    .type(b.LitRedstoneOre)
    .deepslate(b.DeepslateRedstoneOre)
    .deepslate(b.LitDeepslateRedstoneOre)
    .below(-40)
    .groupChance(70)
    .chance(1),

  new Ore().type(b.LapisOre).deepslate(b.DeepslateLapisOre).below(-10).groupChance(80).chance(0.1),
  new Ore().type(b.IronOre).deepslate(b.DeepslateIronOre).below(30).groupChance(50).chance(2),
  new Ore().type(b.GoldOre).deepslate(b.DeepslateGoldOre).below(0).groupChance(10).chance(0.5),
  new Ore().type(b.DiamondOre).deepslate(b.DeepslateDiamondOre).below(17).groupChance(20).chance(0.3),
  new Ore().type(b.EmeraldOre).deepslate(b.DeepslateEmeraldOre).below(-50).chance(0.1),
).stoneChance(90)

export function placeOre(brokenLocation: Vector3, brokenTypeId: string, dimension: Dimension, player: Player) {
  const possibleBlocks = []
  const airCache: Record<string, boolean> = { [Vector.string(brokenLocation)]: false }

  for (const vector of getEdgeBlocksOf(brokenLocation)) {
    const block = dimension.getBlock(vector)
    if (!block || block.isAir) continue
    if (!MineshaftRegion.nearestRegion(block, dimension.type)) continue

    const nearAir = getEdgeBlocksOf(block).find(e => (airCache[Vector.string(e)] ??= !!dimension.getBlock(e)?.isAir))

    if (nearAir) continue
    possibleBlocks.push(block)
  }

  const block = possibleBlocks.randomElement() as Block | undefined
  if (block?.isValid() && !block.isAir) {
    const brokenOre = ores.getOre(brokenTypeId)
    const isDeepslate =
      brokenOre?.isDeepslate ?? (brokenTypeId === MinecraftBlockTypes.Deepslate || brokenLocation.y < -3)
    const overrideTypeId = getOreTypeId({ player, isDeepslate, ore: brokenOre?.ore })
    // console.debug('Overriding ore', overrideTypeId, brokenOre)

    const oreTypeId =
      overrideTypeId ??
      (brokenOre ? ores.with(brokenOre.ore, brokenOre.ore.item.groupChance) : ores).selectOreByChance(
        isDeepslate,
        block.y,
      )

    if (oreTypeId) block.setType(oreTypeId)
  }
}

interface OrePlaceEvent {
  player: Player
  isDeepslate: boolean
  ore: undefined | OreEntry
}

export const OrePlace = new EventSignal<OrePlaceEvent, void | string>()

function getOreTypeId(event: OrePlaceEvent) {
  for (const [action] of EventSignal.sortSubscribers(OrePlace)) {
    const typeId = action(event)
    if (typeId) return typeId
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
const getEdgeBlocksOf = (base: Vector3) =>
  [
    { x: 0, z: 0, y: -1 },
    { x: -1, z: 0, y: 0 },
    { x: 0, z: -1, y: 0 },
    { x: 0, z: 1, y: 0 },
    { x: 1, z: 0, y: 0 },
    { x: 0, z: 0, y: 1 },
  ].map(e => Vector.add(base, e))
