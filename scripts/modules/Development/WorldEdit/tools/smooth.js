import { Block, Vector } from '@minecraft/server'
import { util } from 'xapi.js'

/**
 * @param {Block} baseBlock
 * @param {number} radius
 */
export function smoothVoxelData(baseBlock, radius) {
  // Create a copy of the voxel data
  const voxelDataCopy = getBlocksAreasData(baseBlock, radius)
  const setBlocks = []
  const sizeX = voxelDataCopy.length
  const sizeY = voxelDataCopy[0].length
  const sizeZ = voxelDataCopy[0][0].length
  let blockOperations = 0
  // Apply smoothing
  for (let x = 1; x < sizeX - 1; x++) {
    for (let y = 1; y < sizeY - 1; y++) {
      for (let z = 1; z < sizeZ - 1; z++) {
        blockOperations++
        let sum = 0
        const permutations = []
        const { location, isAidOrLiquid } = voxelDataCopy[x][y][z]
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              const { permutation, isAidOrLiquid } =
                voxelDataCopy[x + dx][y + dy][z + dz]
              if (!isAidOrLiquid) {
                sum++
                blockOperations++
                permutations.push(permutation)
              }
            }
          }
        }
        // If the sum is greater than the number of surrounding voxels / 2, set the voxel to solid
        if (sum > 13 && isAidOrLiquid) {
          setBlocks.push({
            location,
            permutation: permutations.randomElement(),
          })
        } else if (sum < 13 && !isAidOrLiquid) {
          // If the sum is less than the number of surrounding voxels / 2, set the voxel to empty
          setBlocks.push({ location, permutation: undefined })
        }
      }
    }
  }
  return setBlocks
}

const BLOCK_CACHE = {}

/**
 * @param {Block} block
 * @param {number} radius
 */
function getBlocksAreasData(block, radius) {
  const data = []
  for (let y = -radius, y2 = 0; y < radius; y++, y2++) {
    const data2 = []
    for (let x = -radius, x2 = 0; x < radius; x++, x2++) {
      const data3 = []
      for (let z = -radius; z < radius; z++) {
        const location = Vector.add(block.location, new Vector(x, y, z))
        let b,
          permutation,
          isAir = true,
          isLiquid = false,
          isSolid = false
        try {
          b = block.offset(new Vector(x, y, z))
          if (b) ({ permutation, isAir, isLiquid, isSolid } = b)
        } catch (error) {
          util.error(error)
        }
        data3.push({
          block: b,
          permutation,
          location,
          isAir,
          isSolid,
          isLiquid,
          isAidOrLiquid: isAir || isLiquid,
        })
      }
      data2.push(data3)
    }
    data.push(data2)
  }
  return data
}
