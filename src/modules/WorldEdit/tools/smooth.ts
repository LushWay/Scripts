import { Block, BlockPermutation, Player, Vector, world } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ModalForm, is, util } from 'lib'
import { CUSTOM_ITEMS } from 'lib/assets/config'
import { WorldEdit } from 'modules/WorldEdit/lib/WorldEdit'
import { SHARED_POSTFIX, getAllBlockSets } from 'modules/WorldEdit/utils/blocksSet'
import { BaseBrushTool } from '../lib/BaseBrushTool'

// TODO Cache invalidation

/** @extends {BaseBrushTool<{ smoothLevel: number }>} */
class SmoothTool extends BaseBrushTool {
  onBrushUse(player, lore, hit) {
    smoothVoxelData(player, hit.block, lore.size, lore.smoothLevel).catch(util.error)
  }
}

const smoother = new SmoothTool({
  name: 'smoother',
  displayName: 'сглаживание',
  itemStackId: CUSTOM_ITEMS.brush,
  loreFormat: {
    version: 2,

    /** @type {import('modules/WorldEdit/utils/blocksSet').BlocksSetRef} */
    replaceBlocksSet: ['', ''],
    type: 'smoother',
    smoothLevel: 1,
    size: 1,
    maxDistance: 300,
  },
  editToolForm(slot, player) {
    const lore = smoother.parseLore(slot.getLore())

    void new ModalForm('§3Сглаживание')

      .addSlider('Размер', 1, is(player.id, 'grandBuilder') ? 20 : 10, 1, lore.size)
      .addSlider('Сила сглаживания', 1, is(player.id, 'grandBuilder') ? 20 : 10, 1, lore.smoothLevel)
      .addDropdownFromObject(
        'Заменяемый набор блоков',
        Object.fromEntries(Object.keys(getAllBlockSets(player.id)).map(e => [e, e])),
        {
          defaultValue: lore.replaceBlocksSet[1],
          none: true,
          noneText: 'Любой',
        },
      )

      .show(player, (ctx, size, smoothLevel, replaceBlocksSet) => {
        lore.size = size

        lore.smoothLevel = smoothLevel

        if (replaceBlocksSet) lore.replaceBlocksSet = [player.id, replaceBlocksSet]
        slot.nameTag = '§r§3Сглаживание §6' + size
        '§r §f' + (replaceBlocksSet ? replaceBlocksSet.replace(SHARED_POSTFIX, '') : '')

        slot.setLore(smoother.stringifyLore(lore))
        player.success(
          `${
            lore.replaceBlocksSet[0] ? 'Отредактирована' : 'Создана'
          } сглаживатель размером ${size} и силой ${smoothLevel}${
            replaceBlocksSet ? `, заменяемым набором блоков ${replaceBlocksSet}` : ''
          } и радиусом ${size}`,
        )
      })
  },
})

/**
 * @param {Block} baseBlock
 * @param {number} radius
 * @param {Player} player
 * @param {number} smoothLevel
 * @param {(import('modules/WorldEdit/menu').ReplaceTarget | undefined)[]} [replaceBlocks]
 */
export async function smoothVoxelData(player, baseBlock, radius, smoothLevel, replaceBlocks = [undefined]) {
  const pos1 = Vector.add(baseBlock, { x: radius, y: radius, z: radius })
  const pos2 = Vector.add(baseBlock, { x: -radius, y: -radius, z: -radius })

  WorldEdit.forPlayer(player).backup('Сглаживание', pos1, pos2)

  const prefix = '§7Сглаживание: §f '

  player.info(prefix + 'Вычисление...')
  // Create a copy of the voxel data
  const voxelDataCopy = getBlocksAreasData(baseBlock, radius)

  /** @type {BlockCacheMatrix<Pick<BlockCache, 'location' | 'permutation'>>} */
  const setBlocks = {}

  const sizeX = voxelDataCopy.length
  const sizeY = voxelDataCopy[0].length
  const sizeZ = voxelDataCopy[0][0].length
  let operations = 0
  for (let smooth = 0; smooth <= smoothLevel; smooth++) {
    // Apply smoothing
    for (let x = 1; x < sizeX - 1; x++) {
      for (let y = 1; y < sizeY - 1; y++) {
        for (let z = 1; z < sizeZ - 1; z++) {
          let sum = 0
          const permutations = []
          const cache = voxelDataCopy[x][y][z]
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dz = -1; dz <= 1; dz++) {
                const { permutation, void: isVoid } = voxelDataCopy[x + dx][y + dy][z + dz]
                if (!isVoid) {
                  sum++
                  permutations.push(permutation)
                }
              }
            }
          }

          // If the sum is greater than the number of surrounding voxels / 2, set the voxel to solid
          if (sum > 13 && cache.void) {
            cache.permutation = permutations.randomElement()
            cache.void = false
          } else if (sum < 13 && !cache.void) {
            // If the sum is less than the number of surrounding voxels / 2, set the voxel to empty
            cache.permutation = undefined
            cache.void = true
          }

          if (sum !== 13) {
            // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            setBlocks[cache.location.x] ??= {}

            // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            setBlocks[cache.location.x][cache.location.y] ??= {}

            // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            setBlocks[cache.location.x][cache.location.y][cache.location.z] = cache
          }
        }
        operations++

        if (operations % 100 === 0) {
          await nextTick
        }
      }
    }
  }

  const toFill = Object.values(setBlocks)
    // @ts-expect-error TS(2769) FIXME: No overload matches this call.
    .map(e => Object.values(e).map(e => Object.values(e)))
    .flat(2)

  player.info(
    prefix + `Будет заполнено §6${toFill.length} §f${util.ngettext(toFill.length, ['блок', 'блока', 'блоков'])}`,
  )

  operations = 0

  for (const e of toFill) {
    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    if (!e.location) continue

    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    const block = world.overworld.getBlock(e.location)

    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    if (e.permutation) block?.setPermutation(e.permutation)
    else block?.setType(MinecraftBlockTypes.Air)
    operations++

    if (operations % 100 === 0) {
      await nextTick
    }
  }
  player.success(prefix + 'Готово')
}

/**
 * @typedef {{
 *   permutation: BlockPermutation | undefined
 *   location: Vector3
 *   void: boolean
 * }} BlockCache
 */

/**
 * @template {object} [MatrixValue=BlockCache] Default is `BlockCache`
 * @typedef {Record<string, Record<string, Record<string, MatrixValue>>>} BlockCacheMatrix
 */

/** @type {BlockCacheMatrix} */
const BLOCK_CACHE = {}

/**
 * @param {Block} block
 * @param {number} radius
 */
function getBlocksAreasData(block, radius) {
  /** @type {BlockCache[][][]} */
  const datax = []
  for (let y = -radius, y2 = 0; y < radius; y++, y2++) {
    const datay = []
    for (let x = -radius, x2 = 0; x < radius; x++, x2++) {
      const dataz = []
      for (let z = -radius; z < radius; z++) {
        const location = Vector.add(block.location, { x, y, z })

        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        if (BLOCK_CACHE[location.x]?.[location.y]?.[location.z]) {
          // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          dataz.push(BLOCK_CACHE[location.x]?.[location.y]?.[location.z])
          continue
        }

        let permutation,
          isAir = true,
          isLiquid = false,
          isSolid = true

        try {
          const b = block.offset({ x, y, z })
          if (b) ({ permutation, isAir, isLiquid, isSolid } = b)
        } catch (error) {
          util.error(error)
        }
        const newBlockData = {
          permutation,
          location,
          void: isAir || isLiquid || !isSolid,
        }
        dataz.push(newBlockData)

        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        BLOCK_CACHE[location.x] ??= {}

        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        BLOCK_CACHE[location.x][location.y] ??= {}

        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        BLOCK_CACHE[location.x][location.y][location.z] = newBlockData
      }
      datay.push(dataz)
    }
    datax.push(datay)
  }
  return datax
}
