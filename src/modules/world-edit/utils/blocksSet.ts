import { BlockPermutation, BlockTypes, Player } from '@minecraft/server'

import { BlockStateMapping, MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { table } from 'lib/database/abstract'

type BlockStateWeight = [...Parameters<typeof BlockPermutation.resolve>, number]

/** Blocks set is array that describes multiple blocks */
export type BlocksSet = BlockStateWeight[]
/** Blocks set is object that has blocks set name as key and blocks as value */
export type BlocksSets = Record<string, BlocksSet>

/** Reference to the blocks set. You can get set using {@link getBlocksSetByRef} */
export type BlocksSetRef = [owner: string, blocksSetName: string]

const blocksSets = table<BlocksSets>('blockSets')

export function getOtherPlayerBlocksSets(playerId: string): [string, BlocksSets][] {
  return (Object.entries(blocksSets) as [string, BlocksSets][]).filter(e => e[0] !== playerId && e[0])
}

export function getAllBlocksSets(id: string): BlocksSets {
  const playerBlocksSets = blocksSets[id] ?? {}
  return { ...playerBlocksSets, ...DEFAULT_BLOCK_SETS }
}

export function getOwnBlocksSetsCount(id: string) {
  return Object.keys(blocksSets[id] ?? {}).length
}

export function setBlocksSet(id: string, setName: string, set: BlocksSet | undefined) {
  blocksSets[id] ??= {}
  const db = blocksSets[id]
  if (db) {
    if (set) {
      // Append new set onto start

      blocksSets[id] = { [setName]: set, ...db }
    } else {
      Reflect.deleteProperty(db, setName)
    }
  }
}

function getActiveBlockInSetByRef([playerId, blocksSetName]: BlocksSetRef): BlocksSet {
  return getAllBlocksSets(playerId)[blocksSetName].filter(e => e[2] > 0)
}

export function getBlocksSetByRef([playerId, blocksSetName]: BlocksSetRef) {
  return getActiveBlockInSetByRef([playerId, blocksSetName])
    .map(([type, states, weight]) => {
      let permutation

      try {
        permutation = BlockPermutation.resolve(type)
        if (states)
          for (const [state, value] of Object.entries(states)) {
            permutation = permutation.withState(state, value)
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

export function getBlocksSetForReplaceTarget(ref: BlocksSetRef) {
  return getActiveBlockInSetByRef(ref).map(e => {
    if (Array.isArray(e)) {
      const [typeId, states] = e
      return { typeId, states: states ?? {} }
    } else return e
  })
}

export function blocksSetDropdown([_, defaultSet]: BlocksSetRef, player: Player): [string[], { defaultValue: string }] {
  return [Object.keys(getAllBlocksSets(player.id)), { defaultValue: defaultSet }]
}

export function stringifyBlocksSetRef(ref: BlocksSetRef): string {
  return ref[1] in DEFAULT_BLOCK_SETS
    ? ref[1]
    : [Player.name(ref[0]) ?? '', ref[1] || '§7Пустой'].filter(Boolean).join(' ')
}

export function withState<Name extends keyof BlockStateMapping>(
  name: Name,
  states: BlockStateMapping[Name],
  weight = 1,
): BlockStateWeight {
  return [name, states, weight]
}

const trees: BlockStateWeight[] = BlockTypes.getAll()
  .filter(e => e.id.endsWith('_log') || e.id.includes('leaves'))
  .map(e => [e.id, void 0, 1])

trees.push([MinecraftBlockTypes.MangroveRoots, void 0, 1])

export const DEFAULT_BLOCK_SETS: BlocksSets = {
  'Земля': [[MinecraftBlockTypes.GrassBlock, void 0, 1]],
  'Воздух': [[MinecraftBlockTypes.Air, void 0, 1]],
  'Деревья заполняемые': trees,
}

export const SHARED_POSTFIX = '§7 (Общий)'

Object.keys(DEFAULT_BLOCK_SETS).forEach(e => {
  DEFAULT_BLOCK_SETS[e + SHARED_POSTFIX] = DEFAULT_BLOCK_SETS[e]
  Reflect.deleteProperty(DEFAULT_BLOCK_SETS, e)
})
