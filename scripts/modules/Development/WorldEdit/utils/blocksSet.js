import { BlockPermutation, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

/**
 * @typedef {import('@minecraft/vanilla-data').BlockStateMapping} BlockStates
 */

/**
 * @typedef {Parameters<BlockPermutation.resolve>} BlockStateWeight
 */

/**
 * @template {keyof BlockStates} Name
 * @param {Name} name
 * @param {BlockStates[Name]} [states]
 * @returns {BlockStateWeight}
 */
export function withState(name, states) {
  return [name, states]
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
    [MinecraftBlockTypes.MudBricks],
    [MinecraftBlockTypes.PackedMud],
    [MinecraftBlockTypes.BrickBlock],
    withState(MinecraftBlockTypes.CobblestoneWall, { wall_block_type: 'sand' }),
    [MinecraftBlockTypes.HardenedClay],
    withState(MinecraftBlockTypes.Stone, { stone_type: 'sand' }),
  ],
}

/** @type {DynamicPropertyDB<string, BlocksSets | undefined>} */
const PROPERTY = new DynamicPropertyDB('blockSets')
const DB = PROPERTY.proxy()

/**
 * @param {Player} player
 * @returns {BlocksSets}
 */
export function getBlockSets(player) {
  const playerBlockSets = DB[player.id] ?? {}
  return { ...defaultBlockSets, ...playerBlockSets }
}

/**
 * @param {Player} player
 * @param {string} name
 */
export function getBlockSet(player, name) {
  const blocks = getBlockSets(player)[name]
  if (!blocks) return []
  return blocks.map(e => BlockPermutation.resolve(...e))
}

/**
 * @param {Player} player
 * @param {string} defaultSet
 * @returns {[string[], {defaultValue: string}]}
 */
export function blockSetDropdown(player, defaultSet) {
  return [Object.keys(getBlockSets(player)), { defaultValue: defaultSet }]
}
