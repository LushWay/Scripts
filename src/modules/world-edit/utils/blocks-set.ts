import { Block, BlockPermutation, Player } from '@minecraft/server'

import { BlockStateSuperset } from '@minecraft/vanilla-data'
import { noNullable, translateTypeId } from 'lib'
import { table } from 'lib/database/abstract'
import { DEFAULT_BLOCK_SETS, DEFAULT_REPLACE_TARGET_SETS, REPLACE_MODES } from './default-block-sets'
import { Language } from 'lib/assets/lang'

export type BlockStateWeight = [...Parameters<typeof BlockPermutation.resolve>, number]

/** Blocks set is array that describes multiple blocks */
export type BlocksSet = BlockStateWeight[]

/** Blocks set is object that has blocks set name as key and blocks as value */
export type BlocksSets = Record<string, BlocksSet>

/** Reference to the blocks set. You can get set using {@link getBlocksInSet} */
export type BlocksSetRef = [owner: string, blocksSetName: string]

/** Reference to block replace validation */
export interface ReplaceTarget extends ReplaceMode {
  typeId: string
  states: Record<string, string | number | boolean>
}

/** Reference to block replace validation */
export interface ReplaceMode {
  matches(block: Block, replaceBlocks: ReplaceTarget[]): boolean
  select?(block: Block, permutations: BlockPermutation[]): BlockPermutation | undefined
}

const blocksSets = table<BlocksSets>('blockSets', () => ({}))

// GENERAL MANIPULATIONS

export function getOtherPlayerBlocksSets(playerId: string): [string, BlocksSets][] {
  return blocksSets
    .entries()
    .filter((e => e[0] !== playerId && e[1]) as (e: [string, BlocksSets | undefined]) => e is [string, BlocksSets])
}

export function getAllBlocksSets(id: string): BlocksSets {
  const playerBlocksSets = blocksSets.get(id)
  return { ...playerBlocksSets, ...DEFAULT_BLOCK_SETS }
}

export function getOwnBlocksSetsCount(id: string) {
  return Object.keys(blocksSets.get(id)).length
}

export function setBlocksSet(id: string, setName: string, set: BlocksSet | undefined) {
  const db = blocksSets.get(id)
  if (typeof db !== 'undefined') {
    if (set) {
      // Append new set onto start
      blocksSets.set(id, { [setName]: set, ...db })
    } else {
      Reflect.deleteProperty(db, setName)
    }
  }
}

function getActiveBlocksInSet([playerId, blocksSetName]: BlocksSetRef) {
  return (getAllBlocksSets(playerId)[blocksSetName] as BlocksSet | undefined)?.filter(e => e[2] > 0)
}

export function getBlocksInSet([playerId, blocksSetName]: BlocksSetRef) {
  return (getActiveBlocksInSet([playerId, blocksSetName]) ?? [])
    .map(([type, states, weight]) => {
      let permutation

      try {
        permutation = BlockPermutation.resolve(type)
        if (states)
          for (const [state, value] of Object.entries(states)) {
            permutation = permutation.withState(state as keyof BlockStateSuperset, value)
          }
      } catch (e) {
        console.error(
          'Failed to resolve permutation for',
          type,
          'with states',
          states,
          'block set',
          stringifyBlocksSetRef([playerId, blocksSetName]),
        )
      }
      return new Array(weight).fill(permutation) as BlockPermutation[]
    })
    .filter(e => e.length)
    .flat()
}

export function getReplaceTargets(ref: BlocksSetRef): ReplaceTarget[] {
  const defaultReplaceTarget = DEFAULT_REPLACE_TARGET_SETS[ref[1]]
  if (defaultReplaceTarget) return defaultReplaceTarget

  return getActiveBlocksInSet(ref)?.map(fromBlockStateWeightToReplaceTarget) ?? []
}

const defaultReplaceMode: ReplaceMode = {
  matches: () => true,
}

export function getReplaceMode(replaceMode: string) {
  return REPLACE_MODES[replaceMode] ?? defaultReplaceMode
}

// HELPERS

export function replaceWithTargets(
  replaceBlocks: ReplaceTarget[],
  replaceMode: ReplaceMode,
  block: Block,
  permutations: BlockPermutation[],
) {
  const targets = replaceBlocks.slice()
  if (!replaceMode.matches(block, targets)) return

  const getPermutation = () => replaceMode.select?.(block, permutations) ?? permutations.randomElement()
  if (!targets.length) return block.setPermutation(getPermutation())

  for (const replaceBlock of targets) {
    if (!replaceBlock.matches(block, targets)) continue

    block.setPermutation(getPermutation())
  }
}

// DROPRODWN HELPERS

export function blocksSetDropdown([_, defaultSet]: BlocksSetRef, player: Player) {
  return [Object.keys(getAllBlocksSets(player.id)), { defaultValue: defaultSet }] as const
}

export function replaceTargetsDropdown([_, defaultSet]: BlocksSetRef, player: Player) {
  return [
    Object.keys(getAllBlocksSets(player.id)).concat(Object.keys(DEFAULT_REPLACE_TARGET_SETS)),
    { defaultValue: defaultSet, none: true, noneText: 'Любой' },
  ] as const
}

export function replaceModeDropdown(replaceModeName: string) {
  return [Object.keys(REPLACE_MODES), { defaultValue: replaceModeName, none: true, noneText: 'По умолчанию' }] as const
}

// STRINGIFIERS

export function stringifyBlocksSetRef([playerId, set]: BlocksSetRef): string {
  return set in DEFAULT_BLOCK_SETS || set in DEFAULT_REPLACE_TARGET_SETS
    ? set
    : [Player.name(playerId) ?? '', set || '§7Пустой'].filter(Boolean).join(' ')
}

/** Stringifies replace targets, permutations and block weights to something like "Wooden Slab, Stone" */
export function stringifyBlockWeights(targets: (undefined | ReplaceTarget | BlockPermutation | BlockStateWeight)[]) {
  return targets
    .filter(noNullable)
    .map(e =>
      translateTypeId(e instanceof BlockPermutation ? e.type.id : Array.isArray(e) ? e[0] : e.typeId, Language.ru_RU),
    )
    .join(', ')
}

// CONVERTERS

/** Converts replace target or block permutation to permutation. Usefull when need to make code cleaner */
export function toPermutation(target: ReplaceTarget | BlockPermutation) {
  return target instanceof BlockPermutation ? target : BlockPermutation.resolve(target.typeId, target.states)
}

/** Converts replace target or block permutation to replace target. Usefull when need to make code cleaner */
export function toReplaceTarget(permutation: ReplaceTarget | BlockPermutation): ReplaceTarget {
  return permutation instanceof BlockPermutation
    ? {
        typeId: permutation.type.id,
        states: permutation.getAllStates(),
        matches: permutationMatcher,
      }
    : permutation
}

export function fromBlockStateWeightToReplaceTarget([typeId, states]: BlockStateWeight): ReplaceTarget {
  return { typeId, states: states ?? {}, matches: permutationMatcher }
}

function permutationMatcher(this: ReplaceTarget, block: Block) {
  if (!block.permutation.matches(this.typeId)) return false

  const states = block.permutation.getAllStates()
  for (const [name, value] of Object.entries(this.states)) {
    if (states[name] !== value) return false
  }

  return true
}
