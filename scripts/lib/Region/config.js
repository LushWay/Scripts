import { BlockTypes } from '@minecraft/server'
import { SYSTEM_ENTITIES } from 'config'

/**
 * All doors and switches in minecraft
 */
export const DOORS_SWITCHES = BlockTypes.getAll()
  .filter(e => e.id.match(/door|trapdoor|button$/g))
  .map(e => e.id)
  .concat(['minecraft:lever'])

/**
 * A List of all containers a item could be in
 */
export const BLOCK_CONTAINERS = [
  'minecraft:chest',
  'minecraft:ender_chest',
  'minecraft:barrel',
  'minecraft:trapped_chest',
  'minecraft:dispenser',
  'minecraft:dropper',
  'minecraft:furnace',
  'minecraft:blast_furnace',
  'minecraft:lit_furnace',
  'minecraft:lit_blast_furnace',
  'minecraft:hopper',
  'minecraft:shulker_box',
  'minecraft:undyed_shulker_box',
]

/**
 * The default permissions for all regions made
 * @type {RegionPermissions}
 */
export const DEFAULT_REGION_PERMISSIONS = {
  doorsAndSwitches: true,
  openContainers: true,
  pvp: false,
  allowedEntities: ['minecraft:player', 'minecraft:item', ...SYSTEM_ENTITIES],
  owners: [],
}
