import { BlockTypes, Entity } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'

/** All doors and switches in minecraft */
export const DOORS: string[] = []

/** All doors and switches in minecraft */
export const TRAPDOORS: string[] = []

/** All doors and switches in minecraft */
export const SWITCHES: string[] = []

/** All gates in minecraft */
export const GATES: string[] = []

const blocks = BlockTypes.getAll()

function fill(target: string[], filter: (params: { id: string }) => boolean) {
  for (const value of blocks) if (filter(value)) target.push(value.id)
}

fill(DOORS, e => e.id.endsWith('door'))
fill(TRAPDOORS, e => e.id.endsWith('trapdoor'))
fill(SWITCHES, e => /button|lever$/.test(e.id))
fill(GATES, e => e.id.includes('fence_gate'))

/** A list of all containers a item could be in */
export const BLOCK_CONTAINERS = [
  MinecraftBlockTypes.Chest,
  // 'minecraft:ender_chest',
  MinecraftBlockTypes.Barrel,
  MinecraftBlockTypes.TrappedChest,
  MinecraftBlockTypes.Dropper,
  MinecraftBlockTypes.Dispenser,
  MinecraftBlockTypes.Furnace,
  MinecraftBlockTypes.LitFurnace,
  MinecraftBlockTypes.BlastFurnace,
  MinecraftBlockTypes.LitBlastFurnace,
  MinecraftBlockTypes.Smoker,
  MinecraftBlockTypes.LitSmoker,
  MinecraftBlockTypes.Hopper,
  'minecraft:shulker_box',
  'minecraft:undyed_shulker_box',
  MinecraftBlockTypes.DecoratedPot,
  ...Object.values(MinecraftBlockTypes).filter(e => e.endsWith('shulker_box')),
]

/** With this entities player can interact (e.g. npc, custom buttons, etc) */
export const INTERACTABLE_ENTITIES: string[] = [
  MinecraftEntityTypes.Npc,
  MinecraftEntityTypes.Horse,
  MinecraftEntityTypes.Mule,
  MinecraftEntityTypes.Donkey,
]

/**
 * System entities like database, floating text, sit and other which are not affected by health bar display, region
 * permissions and other filterings
 */
export const NOT_MOB_ENTITIES = [
  CustomEntityTypes.Database,
  CustomEntityTypes.FloatingText,
  CustomEntityTypes.FloatingTextNpc,
  CustomEntityTypes.Sit,
  CustomEntityTypes.Grave,
  CustomEntityTypes.Loot,
  MinecraftEntityTypes.Npc,
  'minecraft:item',
  'minecraft:leash_knot',
  MinecraftEntityTypes.FishingHook,
] as string[]

export const PVP_ENTITIES = [
  MinecraftEntityTypes.Player,
  MinecraftEntityTypes.Arrow,
  MinecraftEntityTypes.Snowball,
  CustomEntityTypes.Fireball,
  CustomEntityTypes.Cannon,
]

const ALLOW_SPAWN_PROP = 'allowSpawn'
export function forceAllowSpawnInRegion(entity: Entity) {
  if (entity.isValid) entity.setDynamicProperty(ALLOW_SPAWN_PROP, true)
}

export function isForceSpawnInRegionAllowed(entity: Entity) {
  if (entity.isValid) return entity.getDynamicProperty(ALLOW_SPAWN_PROP) === true
  return false
}
