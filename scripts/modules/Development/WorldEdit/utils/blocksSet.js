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
const defaultBlockSets = {
  'Земля': [[MinecraftBlockTypes.Grass, void 0, 1]],
  'Воздух': [[MinecraftBlockTypes.Air, void 0, 1]],
  'Каменная стена': [
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

/** @type {DynamicPropertyDB<string, BlocksSets | undefined>} */
const PROPERTY = new DynamicPropertyDB('blockSets')
const DB = PROPERTY.proxy()

/**
 * @param {Player} player
 * @returns {BlocksSets}
 */
export function getAllBlockSets(player) {
  const playerBlockSets = DB[player.id] ?? {}
  return { ...defaultBlockSets, ...playerBlockSets }
}

/**
 *
 * @param {Player} player
 * @param {string} setName
 * @param {BlockStateWeight[]} set
 */
export function setBlockSet(player, setName, set) {
  DB[player.id] ??= {}
  const db = DB[player.id]
  if (db) db[setName] = set
}

/**
 * @param {Player} player
 * @param {string} name
 */
export function getBlockSet(player, name) {
  const blocks = getAllBlockSets(player)[name]
  if (!blocks) return []
  return blocks
    .filter(e => e[2] > 0)
    .map(([type, states, weight]) =>
      new Array(weight).fill(BlockPermutation.resolve(type, states)),
    )
    .flat()
}

/**
 * @param {Player} player
 * @param {string} defaultSet
 * @returns {[string[], {defaultValue: string}]}
 */
export function blockSetDropdown(player, defaultSet) {
  return [Object.keys(getAllBlockSets(player)), { defaultValue: defaultSet }]
}
