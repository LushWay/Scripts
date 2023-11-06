import { system, world } from '@minecraft/server'
import { util } from 'xapi.js'
import { WE_CONFIG } from '../config.js'
import { WEBUILD } from './WorldEditBuilder.js'

/**
 * Sets Pos1 To a new Block Location
 * @param {Vector3} pos1 pos1
 * @param {Vector3} pos2 pos2
 * @param {Array<string>} blocks blocks to use to fill block
 * @param {string} rb Blocks to replace
 * @example new Fill(BlockLocation, BlockLocation, ["stone", "wood"], ["grass"]);
 */
export function FillFloor(pos1, pos2, blocks, rb = 'any') {
  util.catch(async () => {
    WEBUILD.backup(pos1, pos2)
    const replaceBlocks = []
    if (rb)
      for (const block of rb.split(',')) {
        replaceBlocks.push(block.replace('.', ' '))
      }

    let blocksSet = 0
    for (let x = pos1.x; x <= pos2.x; x++) {
      for (let y = pos1.y; y <= pos2.y; y++) {
        for (let z = pos1.z; z <= pos2.z; z++) {
          const block = blocks.randomElement().replace('.', ' ')
          if (rb !== 'any') {
            for (const replaceBlock of replaceBlocks) {
              const replace = ` replace ${replaceBlock}`
              world.overworld.runCommand(
                `fill ${x} ${y} ${z} ${x} ${y} ${z} ${block} ${replace}`
              )
            }
          } else
            world.overworld.runCommand(
              `fill ${x} ${y} ${z} ${x} ${y} ${z} ${block}`
            )

          blocksSet++
        }
      }
      if (blocksSet >= WE_CONFIG.BLOCKS_BEFORE_AWAIT) {
        await system.sleep(WE_CONFIG.TICKS_TO_SLEEP)
        blocksSet = 0
      }
    }
  })
}
