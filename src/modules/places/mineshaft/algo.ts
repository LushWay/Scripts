import { Block, Dimension, Player } from '@minecraft/server'
import { MinecraftBlockTypes as b, MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib'
import { EventSignal } from 'lib/event-signal'
import { getEdgeBlocksOf } from './get-edge-blocks-of'
import { MineshaftRegion } from './mineshaft-region'
import { Ore, OreCollector, OreEntry } from './ore-collector'

export const ores = new OreCollector(
  new Ore().type(b.CoalOre).deepslate(b.DeepslateCoalOre).groupChance(90).range(60, 0).weight(5),
  new Ore().type(b.CopperOre).deepslate(b.DeepslateCopperOre).range(20, -20).groupChance(90).weight(1),
  new Ore()
    .type(b.RedstoneOre, b.LitRedstoneOre)
    .deepslate(b.DeepslateRedstoneOre, b.LitDeepslateRedstoneOre)
    .range(20, -30)
    .groupChance(70)
    .weight(1),

  new Ore().type(b.LapisOre).deepslate(b.DeepslateLapisOre).range(-10, -30).groupChance(80).weight(0.8),
  new Ore().type(b.IronOre).deepslate(b.DeepslateIronOre).range(50, -30).groupChance(50).weight(2),
  new Ore().type(b.GoldOre).deepslate(b.DeepslateGoldOre).range(0, -64).groupChance(10).weight(0.5),
  new Ore().type(b.DiamondOre).deepslate(b.DeepslateDiamondOre).range(0, -64).groupChance(60).weight(0.3),
  new Ore().type(b.EmeraldOre).deepslate(b.DeepslateEmeraldOre).range(-30, -64).weight(0.05),
).stoneChance(40)

export function placeOre(brokenLocation: Block, brokenTypeId: string, dimension: Dimension, player: Player) {
  const possibleBlocks = []
  const airCache: Record<string, { air: boolean; block: Block }> = {
    [Vec.string(brokenLocation)]: { air: false, block: brokenLocation },
  }

  for (const vector of getEdgeBlocksOf(brokenLocation)) {
    const block = dimension.getBlock(vector)
    if (!block || block.isAir) continue
    if (!MineshaftRegion.getAt(block)) continue

    const nearAir = getEdgeBlocksOf(block).some(location => {
      const key = Vec.string(location)
      if (airCache[key]) return airCache[key].air

      const block = dimension.getBlock(location)
      if (block) return (airCache[key] = { block, air: !block.isSolid }).air
      else return true
    })

    if (nearAir) continue
    possibleBlocks.push(block)
  }
  if (!possibleBlocks.length) return

  const brokenOre = ores.getOre(brokenTypeId)
  const isDeepslate =
    brokenOre?.isDeepslate ?? (brokenTypeId === MinecraftBlockTypes.Deepslate || brokenLocation.y < -3)

  for (const [action] of EventSignal.sortSubscribers(OrePlace)) {
    const placed = action({ player, isDeepslate, brokenOre: brokenOre?.ore, possibleBlocks, place, brokenLocation })
    if (placed) return
  }
}

function place(block: Block, oreTypeId: string) {
  if (block.isValid && !block.isAir && oreTypeId) {
    block.setType(oreTypeId)
    return true
  } else return false
}

interface OrePlaceEvent {
  player: Player
  isDeepslate: boolean
  brokenOre: undefined | OreEntry
  brokenLocation: Block
  possibleBlocks: Block[]
  place: (block: Block, oreTypeId: string) => boolean
}

export const OrePlace = new EventSignal<OrePlaceEvent, boolean>()

OrePlace.subscribe(({ brokenOre, isDeepslate, brokenLocation, possibleBlocks, place }) => {
  const oreTypeId = brokenOre
    ? isDeepslate
      ? b.Deepslate
      : b.Stone
    : ores.selectOreByChance(isDeepslate, brokenLocation.y)
  const first = possibleBlocks.randomElement()
  place(first, oreTypeId)

  for (const block of possibleBlocks.filter(e => e !== first)) {
    if (Math.randomInt(0, 100) > (brokenOre?.item.groupChance ?? 50)) place(block, oreTypeId)
  }

  return true
}, -1)
