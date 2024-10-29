import { BlockPermutation, BlockTypes } from '@minecraft/server'
import { BlockStateSuperset, MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { noNullable } from 'lib'
import { BlockStateWeight, BlocksSets, ReplaceTarget, fromBlockStateWeightToReplaceTarget } from './blocks-set'

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
  ...Object.map(
    {
      'Любой цельный блок': {
        matches: block => block.isSolid,
      },
      'Любой водонепроницаемый блок': {
        matches: block => !block.type.canBeWaterlogged,
      },
      'Любой полублок': {
        matches: block => isSlab(block.typeId),
      },
      'Замена соответств. блока': {
        matches() {
          return true
        },
        select(block, permutations) {
          if (block.isAir) return air

          let permutation: BlockPermutation | undefined

          const { typeId } = block
          for (const isType of allBlockTypes) {
            if (isType(typeId)) {
              permutation = permutations.filter(e => isType(e.type.id)).randomElement()
            }
          }

          if (!permutation && !block.type.canBeWaterlogged) {
            permutation = permutations.filter(e => allBlockTypes.every(isType => !isType(e.type.id))).randomElement()
          }

          if (permutation) {
            for (const [state, value] of Object.entries(block.permutation.getAllStates())) {
              try {
                if (!blockPositionStates.includes(state)) continue
                permutation = permutation.withState(state, value)
              } catch (e) {
                console.warn('Unable to assign state', { state, value, typeId: block.typeId })
              }
            }

            return permutation
          }

          return block.permutation
        },
      },
    } satisfies Record<string, Pick<ReplaceTarget, 'matches' | 'select'>>,
    (key, value) => [key, [{ typeId: key, states: {}, ...value }]],
  ),
  'Любое дерево': trees.map(fromBlockStateWeightToReplaceTarget).filter(noNullable),
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

export const SHARED_POSTFIX = '§7 (Общий)'
addPostfix(DEFAULT_BLOCK_SETS)
addPostfix(DEFAULT_REPLACE_TARGET_SETS)
function addPostfix(blocksSet: Record<string, unknown>) {
  Object.keys(blocksSet).forEach(e => {
    blocksSet[e + SHARED_POSTFIX] = blocksSet[e]
    Reflect.deleteProperty(blocksSet, e)
  })
}
