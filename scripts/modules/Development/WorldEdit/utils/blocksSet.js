import { BlockPermutation, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

/**
 * @typedef {import('@minecraft/vanilla-data').BlockStateMapping} BlockStates
 */

/**
 * @typedef {[...Parameters<BlockPermutation.resolve>, number?]} BlockStateWeight
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
  'Земля': [[MinecraftBlockTypes.Grass]],
  'Воздух': [[MinecraftBlockTypes.Air]],
  'Пещерный камень': [
    [MinecraftBlockTypes.Stone],
    [MinecraftBlockTypes.Cobblestone],
  ],
  'Каменная стена': [
    [MinecraftBlockTypes.MudBricks, undefined, 2],
    [MinecraftBlockTypes.PackedMud],
    [MinecraftBlockTypes.BrickBlock],
    withState(MinecraftBlockTypes.CobblestoneWall, { wall_block_type: 'sand' }),
    [MinecraftBlockTypes.HardenedClay],
    withState(MinecraftBlockTypes.Stone, { stone_type: 'sand' }, 2),
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
    .filter(e => (e[2] ?? 1) > 0)
    .map(([type, states, weight]) =>
      new Array(weight ?? 1).fill(BlockPermutation.resolve(type, states))
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
