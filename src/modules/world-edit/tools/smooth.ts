import { Block, BlockPermutation, Player, system, world } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { is, ModalForm, util, Vector } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ngettext } from 'lib/utils/ngettext'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'
import { BlocksSetRef, getAllBlocksSets, SHARED_POSTFIX } from 'modules/world-edit/utils/blocks-set'
import { WorldEditToolBrush } from '../lib/world-edit-tool-brush'

interface SmoothProps {
  smoothLevel: number
}

// TODO Cache invalidation

class SmoothTool extends WorldEditToolBrush<SmoothProps> {
  onBrushUse: WorldEditToolBrush<SmoothProps>['onBrushUse'] = (player, lore, hit) => {
    // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
    smoothVoxelData(player, hit.block, lore.size, lore.smoothLevel).catch(console.error)
  }
}

const smoother = new SmoothTool({
  id: 'smoother',
  name: 'сглаживание',
  itemStackId: Items.WeBrush,
  loreFormat: {
    version: 2,

    replaceBlocksSet: ['', ''] as BlocksSetRef,
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
        Object.fromEntries(Object.keys(getAllBlocksSets(player.id)).map(e => [e, e])),
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
        slot.nameTag = `§r§3Сглаживание §6${size}§r §f${replaceBlocksSet ? replaceBlocksSet.replace(SHARED_POSTFIX, '') : ''}`

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

export async function smoothVoxelData(
  player: Player,
  baseBlock: Block,
  radius: number,
  smoothLevel: number,
  replaceBlocks: (import('modules/world-edit/menu').ReplaceTarget | undefined)[] = [undefined],
) {
  return new Promise<void>((resolve, reject) => {
    const pos1 = Vector.add(baseBlock, { x: radius, y: radius, z: radius })
    const pos2 = Vector.add(baseBlock, { x: -radius, y: -radius, z: -radius })

    WorldEdit.forPlayer(player).backup('Сглаживание', pos1, pos2)

    function* smootherJob() {
      try {
        const prefix = '§7Сглаживание: §f '

        if (radius > 5) player.info(prefix + 'Вычисление...')
        // Create a copy of the voxel data
        const time1 = util.benchmark('getBlocksAreasData', 'we')
        const gen = getBlocksAreasData(baseBlock, radius)
        let value
        while (!(value = gen.next()).done) yield

        const voxelDataCopy = value.value

        type BlockToFill = Pick<BlockCache, 'location' | 'permutation'>
        const setBlocks: BlockCacheMatrix<BlockToFill> = {}
        time1()

        const time2 = util.benchmark('calculate smooth', 'we')

        const sizeX = voxelDataCopy.length
        const sizeY = voxelDataCopy[0].length
        const sizeZ = voxelDataCopy[0][0].length
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
                yield

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
                  const location = cache.location
                  ;((setBlocks[location.x] ??= {})[location.y] ??= {})[location.z] = cache
                }
              }
            }
          }
        }

        time2()
        const time3 = util.benchmark('fill blocks', 'we')

        const toFill: BlockToFill[] = []
        for (const x of Object.values(setBlocks)) {
          if (!x) continue
          for (const y of Object.values(x)) {
            if (!y) continue
            for (const z of Object.values(y)) {
              if (!z) continue
              toFill.push(z)
            }
          }
        }

        if (radius > 5)
          player.info(
            prefix + `Будет заполнено §6${toFill.length} §f${ngettext(toFill.length, ['блок', 'блока', 'блоков'])}`,
          )

        for (const e of toFill) {
          const block = world.overworld.getBlock(e.location)

          if (e.permutation) block?.setPermutation(e.permutation)
          else block?.setType(MinecraftBlockTypes.Air)

          yield
        }

        time3()
        if (radius > 5) player.success(prefix + 'Готово')
        resolve()
      } catch (e) {
        reject(e as Error)
      }
    }
    system.runJob(smootherJob())
  })
}

interface BlockCache {
  permutation: BlockPermutation | undefined
  location: Vector3
  void: boolean
}

type BlockCacheMatrix<MatrixValue extends object = BlockCache> = Record<
  string,
  undefined | Record<string, undefined | Record<string, undefined | MatrixValue>>
>

const BLOCK_CACHE: BlockCacheMatrix = {}

function* getBlocksAreasData(block: Block, radius: number) {
  const bx: BlockCache[][][] = []
  for (let y = -radius, y2 = 0; y < radius; y++, y2++) {
    const by = []
    for (let x = -radius, x2 = 0; x < radius; x++, x2++) {
      const bz = []
      for (let z = -radius; z < radius; z++) {
        const location = Vector.add(block.location, { x, y, z })

        const value = BLOCK_CACHE[location.x]?.[location.y]?.[location.z]
        if (value) {
          bz.push(value)
          yield
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
          console.error(error)
        }
        const newBlockData = {
          permutation,
          location,
          void: isAir || isLiquid || !isSolid,
        }
        bz.push(newBlockData)
        ;((BLOCK_CACHE[location.x] ??= {})[location.y] ??= {})[location.z] = newBlockData

        yield
      }
      by.push(bz)
    }
    bx.push(by)
  }
  return bx
}
