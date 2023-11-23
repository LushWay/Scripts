import { BlockPermutation, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
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

/**
 * @typedef {Record<string, BlockStateWeight[]>} BlocksSets
 */

/** @type {BlocksSets} */
export const DEFAULT_BLOCK_SETS = {
  'Земля': [[MinecraftBlockTypes.Grass, void 0, 1]],
  'Воздух': [[MinecraftBlockTypes.Air, void 0, 1]],
  'Стена каменоломни': [
    [MinecraftBlockTypes.MudBricks, void 0, 2],
    [MinecraftBlockTypes.PackedMud, void 0, 1],
    [MinecraftBlockTypes.BrickBlock, void 0, 1],
    withState(MinecraftBlockTypes.CobblestoneWall, {
      wall_block_type: 'granite',
    }),
    [MinecraftBlockTypes.HardenedClay, void 0, 1],
    withState(MinecraftBlockTypes.Stone, { stone_type: 'granite' }, 2),
  ],
}
export const SHARED_POSTFIX = '§7 (Общий)'

Object.keys(DEFAULT_BLOCK_SETS).forEach(e => {
  DEFAULT_BLOCK_SETS[e + SHARED_POSTFIX] = DEFAULT_BLOCK_SETS[e]
  delete DEFAULT_BLOCK_SETS[e]
})

/** @type {DynamicPropertyDB<string, BlocksSets | undefined>} */
const PROPERTY = new DynamicPropertyDB('blockSets')
const DB = PROPERTY.proxy()

/**
 * @param {string} playerId
 * @returns {[string, BlocksSets][]}
 */
export function getOtherPlayersBlockSets(playerId) {
  // @ts-expect-error We checked it
  return Object.entries(DB).filter(e => e[0] !== playerId && e[0])
}

/**
 * @param {string} id
 * @returns {BlocksSets}
 */
export function getAllBlockSets(id) {
  const playerBlockSets = DB[id] ?? {}
  return { ...playerBlockSets, ...DEFAULT_BLOCK_SETS }
}

/**
 *
 * @param {string} id
 * @param {string} setName
 * @param {BlockStateWeight[] | undefined} set
 */
export function setBlockSet(id, setName, set) {
  DB[id] ??= {}
  const db = DB[id]
  if (db) {
    if (set) db[setName] = set
    else delete db[setName]
  }
}

/**
 * @param {BlocksSetRef} set
 */
export function getBlockSet([player, name]) {
  const blocks = getAllBlockSets(player)[name]
  if (!blocks) return []
  return blocks
    .filter(e => e[2] > 0)
    .map(([type, states, weight]) =>
      new Array(weight).fill(BlockPermutation.resolve(type, states))
    )
    .flat()
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
 */
export function stringifyBlocksSetRef(ref) {
  return [Player.name(ref[0]) ?? '', ref[1]].join(' ')
}
