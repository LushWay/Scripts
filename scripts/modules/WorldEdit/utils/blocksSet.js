import { BlockPermutation, BlockTypes, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { migration } from 'lib/Database/Migrations.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

/**
 * @typedef {import('@minecraft/vanilla-data').BlockStateMapping} BlockStates
 */

/**
 * @typedef {[...Parameters<BlockPermutation.resolve>, number]} BlockStateWeight
 */

/**
 * @template {keyof BlockStates} Name
 * @param {Name} name
 * @param {BlockStates[Name]} [states]
 * @param {number} [weight]
 * @returns {BlockStateWeight}
 */
export function withState(name, states, weight = 1) {
  return [name, states, weight]
}

/** @type {BlockStateWeight} */
const mangroove = [MinecraftBlockTypes.MangroveRoots, void 0, 1]

/** @type {BlockStateWeight[]} */
const Trees = BlockTypes.getAll()
  .filter(e => e.id.endsWith('_log') || e.id.includes('leaves'))
  .map(e => [e.id, void 0, 1])

Trees.push(mangroove)

/**
 * @typedef {Record<string, BlockStateWeight[]>} BlocksSets
 */

/** @type {BlocksSets} */
export const DEFAULT_BLOCK_SETS = {
  'Земля': [[MinecraftBlockTypes.Grass, void 0, 1]],
  'Воздух': [[MinecraftBlockTypes.Air, void 0, 1]],
  'Деревья заполняемые': Trees,
}

export const SHARED_POSTFIX = '§7 (Общий)'

Object.keys(DEFAULT_BLOCK_SETS).forEach(e => {
  DEFAULT_BLOCK_SETS[e + SHARED_POSTFIX] = DEFAULT_BLOCK_SETS[e]
  delete DEFAULT_BLOCK_SETS[e]
})

/** @type {DynamicPropertyDB<string, BlocksSets | undefined>} */
const PROPERTY = new DynamicPropertyDB('blockSets')
const blockSets = PROPERTY.proxy()

/**
 * @param {string} playerId
 * @returns {[string, BlocksSets][]}
 */
export function getOtherPlayersBlockSets(playerId) {
  // @ts-expect-error We checked it
  return Object.entries(blockSets).filter(e => e[0] !== playerId && e[0])
}

/**
 * @param {string} id
 * @returns {BlocksSets}
 */
export function getAllBlockSets(id) {
  const playerBlockSets = blockSets[id] ?? {}
  return { ...playerBlockSets, ...DEFAULT_BLOCK_SETS }
}

/**
 *
 * @param {string} id
 * @param {string} setName
 * @param {BlockStateWeight[] | undefined} set
 */
export function setBlockSet(id, setName, set) {
  blockSets[id] ??= {}
  const db = blockSets[id]
  if (db) {
    if (set) {
      // Append new set onto start
      blockSets[id] = { [setName]: set, ...db }
    } else {
      delete db[setName]
    }
  }
}

migration('blocks set order', () => {
  for (const [player, blocksSets] of Object.entries(blockSets)) {
    if (blocksSets) blockSets[player] = Object.fromEntries(Object.entries(blocksSets).reverse())
  }
})

/**
 * @overload
 * @param {BlocksSetRef} set
 * @returns {BlocksSets[string]}
 */

/**
 * @overload
 * @param {BlocksSetRef} set
 * @param {BlocksSets[string] | undefined[]} [noBlocks]
 * @returns {BlocksSets[string] | undefined[]}
 */

/**
 * @param {BlocksSetRef} set
 * @param {BlocksSets[string]} [noBlocks]
 */
function getBlockSetRaw([player, name], noBlocks = []) {
  const blocks = getAllBlockSets(player)[name]
  if (!blocks) return noBlocks
  return blocks.filter(e => e[2] > 0)
}

/**
 * @param {BlocksSetRef} set
 * @returns {BlockPermutation[]}
 */
export function getBlockSet([player, name]) {
  return getBlockSetRaw([player, name])
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
          stringifyBlocksSetRef([player, name])
        )
      }
      return new Array(weight).fill(permutation)
    })
    .filter(e => e.length)
    .flat()
}

/**
 * @param {BlocksSetRef} ref
 */
export function getBlockSetForReplaceTarget(ref) {
  return getBlockSetRaw(ref, [undefined]).map(e => {
    if (Array.isArray(e)) {
      const [typeId, states] = e
      return { typeId, states: states ?? {} }
    } else return e
  })
}

/**
 * @typedef {[string, string]} BlocksSetRef
 */

/**
 * @param {BlocksSetRef} info
 * @param {Player} player
 * @returns {[string[], {defaultValue: string}]}
 */
export function blockSetDropdown([_, defaultSet], player) {
  return [Object.keys(getAllBlockSets(player.id)), { defaultValue: defaultSet }]
}

/**
 * @param {BlocksSetRef} ref
 * @returns {string}
 */
export function stringifyBlocksSetRef(ref) {
  return ref[1] in DEFAULT_BLOCK_SETS
    ? ref[1]
    : [Player.name(ref[0]) ?? '', ref[1] || '§7Пустой'].filter(Boolean).join(' ')
}
