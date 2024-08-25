import { BlockTypes } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { CustomEntityTypes } from 'lib/assets/config'

/** All doors and switches in minecraft */
export const DOORS = BlockTypes.getAll()
  .filter(e => e.id.endsWith('_door'))
  .map(e => e.id)

/** All doors and switches in minecraft */
export const TRAPDOORS = BlockTypes.getAll()
  .filter(e => e.id.endsWith('_trapdoor'))
  .map(e => e.id)

/** All doors and switches in minecraft */
export const SWITCHES = BlockTypes.getAll()
  .filter(e => /button|lever$/.test(e.id))
  .map(e => e.id)

/** A list of all containers a item could be in */
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

/** With this entities player can interact (e.g. npc, custom buttons, etc) */
export const INTERACTABLE_ENTITIES: string[] = [MinecraftEntityTypes.Npc]

/**
 * System entities like database, floating text, sit and other which are not affected by health bar display, region
 * permissions and other filterings
 */
export const NOT_MOB_ENTITIES = [
  CustomEntityTypes.Database,
  CustomEntityTypes.FloatingText,
  CustomEntityTypes.Sit,
  CustomEntityTypes.Grave,
  CustomEntityTypes.Loot,
  MinecraftEntityTypes.Npc,
  'minecraft:item',
] as string[]
