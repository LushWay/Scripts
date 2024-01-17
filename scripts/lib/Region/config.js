import { BlockTypes } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { CUSTOM_ENTITIES } from 'config'

/**
 * All doors and switches in minecraft
 */
export const DOORS_AND_SWITCHES = BlockTypes.getAll()
  .filter(e => e.id.match(/door|trapdoor|button$/g))
  .map(e => e.id)
  .concat(['minecraft:lever'])

/**
 * A list of all containers a item could be in
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
 * To edit each region type permissions, e.g. MineshaftRegion or
 * SafeAreaRegion permissions - edit defaultPermissions property in the class directly
 * @type {RegionPermissions}
 */
export const DEFAULT_REGION_PERMISSIONS = {
  doorsAndSwitches: true,
  openContainers: true,
  pvp: false,
  allowedEntities: [MinecraftEntityTypes.Player, 'minecraft:item'],
  owners: [],
}

/**
 * With this entities player can interact (e.g. npc, custom buttons, etc)
 * @type {string[]}
 */
export const INTERACTABLE_ENTITIES = [MinecraftEntityTypes.Npc]

/**
 * System entities like database, floating text, sit and other which are not
 * affected by health bar display, region permissions and other filterings
 */
export const NOT_MOB_ENTITIES = [
  CUSTOM_ENTITIES.database,
  CUSTOM_ENTITIES.floatingText,
  CUSTOM_ENTITIES.sit,
  MinecraftEntityTypes.Npc,
]
