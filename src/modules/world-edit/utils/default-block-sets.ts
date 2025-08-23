import { BlockPermutation, BlockTypes, LiquidType } from '@minecraft/server'
import { BlockStateSuperset, MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { noNullable } from 'lib'
import {
  BlockStateWeight,
  BlocksSets,
  ReplaceMode,
  ReplaceTarget,
  fromBlockStateWeightToReplaceTarget,
} from './blocks-set'

const trees: BlockStateWeight[] = BlockTypes.getAll()
  .filter(e => e.id.endsWith('_log') || e.id.includes('leaves'))
  .map(e => [e.id, void 0, 1])
trees.push([MinecraftBlockTypes.MangroveRoots, void 0, 1])

export const DEFAULT_BLOCK_SETS: BlocksSets = {
  Земля: [[MinecraftBlockTypes.GrassBlock, void 0, 1]],
  Воздух: [[MinecraftBlockTypes.Air, void 0, 1]],
}

function isSlab(typeId: string) {
  return typeId.includes('slab') && !isDoubleSlab(typeId)
}

function isDoubleSlab(typeId: string) {
  return typeId.includes('double_slab')
}

function isStairs(typeId: string) {
  return typeId.includes('stairs')
}

function isWall(typeId: string) {
  return typeId.endsWith('wall')
}

function isTrapdoor(typeId: string) {
  return typeId.endsWith('trapdoor')
}

function isGlass(typeId: string) {
  return typeId.includes('glass') && !isGlassPane(typeId)
}

function isGlassPane(typeId: string) {
  return typeId.includes('glass_pane')
}

const allBlockTypes = [isSlab, isStairs, isWall, isTrapdoor, isGlass, isGlassPane]
const air = BlockPermutation.resolve(MinecraftBlockTypes.Air)

export const DEFAULT_REPLACE_TARGET_SETS: Record<string, ReplaceTarget[]> = {
  'Любое дерево': trees.map(fromBlockStateWeightToReplaceTarget).filter(noNullable),
}

export const REPLACE_MODES: Record<string, ReplaceMode> = {
  'Не воздух': {
    matches: block => !block.isAir,
  },
  'Любой цельный блок': {
    matches: block => block.isSolid && !block.isAir,
  },
  'Любой водонепроницаемый блок': {
    matches: block => !block.canContainLiquid(LiquidType.Water) && !block.isAir && !block.isLiquid,
  },
  'Любой полублок': {
    matches: block => isSlab(block.typeId),
  },
  'Любой кроме': {
    matches: (block, replaceBlocks) => {
      const result = replaceBlocks.every(e => !e.matches(block, replaceBlocks))
      replaceBlocks.splice(0, replaceBlocks.length)
      return result
    },
  },
  'Замена соответств. блока': {
    matches: () => true,
    select(block, permutations) {
      if (block.isAir) return air

      let permutation: BlockPermutation | undefined
      const { typeId } = block
      for (const isType of allBlockTypes) {
        if (isType(typeId)) {
          permutation = permutations.filter(e => isType(e.type.id)).randomElement()
          break
        }
      }

      if (!permutation && !block.canContainLiquid(LiquidType.Water)) {
        permutation = permutations.filter(e => allBlockTypes.every(isType => !isType(e.type.id))).randomElement()
      }

      if (permutation) {
        for (const [state, value] of Object.entries(block.permutation.getAllStates())) {
          try {
            if (!blockPositionStates.includes(state)) continue
            permutation = permutation.withState(state as keyof BlockStateSuperset, value)
          } catch (e) {
            console.warn('Unable to assign state', { state, value, typeId: block.typeId })
          }
        }

        return permutation
      } else return block.permutation
    },
  },
}

const blockPositionStates: string[] = [
  'minecraft:vertical_half',
  'minecraft:cardinal_direction',
  'minecraft:block_face',
  'minecraft:facing_direction',
  'upside_down_bit',
  'weirdo_direction',
  'top_slot_bit',
] satisfies (keyof BlockStateSuperset)[]

const SHARED_POSTFIX = '§7 (Общий)'

export function shortenBlocksSetName(name: string | undefined | null) {
  return name ? name.replace(SHARED_POSTFIX, '') : ''
}

addPostfix(DEFAULT_BLOCK_SETS)
addPostfix(DEFAULT_REPLACE_TARGET_SETS)

function addPostfix(blocksSet: Record<string, unknown>) {
  Object.keys(blocksSet).forEach(e => {
    blocksSet[e + SHARED_POSTFIX] = blocksSet[e]
    Reflect.deleteProperty(blocksSet, e)
  })
}
