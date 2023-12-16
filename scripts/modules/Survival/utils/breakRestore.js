import { BlockPermutation, LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { MineshaftRegion } from 'lib/Region/Region.js'
import { util } from 'smapi.js'

export const DELAYED_BLOCK_PLACE_DB = new DynamicPropertyDB('delayedBlockPlace', {
  /**
   * @type {Record<string, {typeId: string, states?: Record<string, string | number | boolean>, date: number}>}
   */
  type: {},
}).proxy()

world.beforeEvents.playerBreakBlock.subscribe(event => {
  const mineshaftRegion = MineshaftRegion.locationInRegion(event.block, event.dimension.type)
  if (mineshaftRegion) {
    // TODO Add to break db to restore later
  }
})

system.runInterval(
  () => {
    for (const [xyz, data] of Object.entries(DELAYED_BLOCK_PLACE_DB)) {
      if (Date.now() < data.date) continue

      const end = () => delete DELAYED_BLOCK_PLACE_DB[xyz]
      const xyzN = xyz.split(' ').map(Number)
      if (!xyzN[0] || !xyzN[1] || !xyzN[2]) {
        end()
        continue
      }

      try {
        const block = world.overworld.getBlock({
          x: xyzN[0],
          y: xyzN[1],
          z: xyzN[2],
        })

        block?.setPermutation(BlockPermutation.resolve(data.typeId, data.states))
        end()
      } catch (e) {
        if (e instanceof LocationInUnloadedChunkError) continue
        end()
        util.error(e)
      }
    }
  },
  'delayed block place',
  10
)
