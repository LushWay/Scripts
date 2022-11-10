/**
 * The default permissions for all regions made
 */
export const DEFAULT_REGION_PERMISSIONS = {
  /**
   * If players in this region can use doors, trapdoors, and switches like buttons and levers
   */
  doorsAndSwitches: true,
  /**
   * If players in this region can open containers, this is like chests, furnaces, hoppers, etc
   */
  openContainers: true,
  /**
   * If the players in this region can fight each other
   */
  pvp: false,
  /**
   * the entitys allowed in this region
   */
  allowedEntitys: ["minecraft:player", "minecraft:npc", "minecraft:item"],
};

/**
 * All doors and switches in minecraft
 */
export const DOORS_SWITCHES = [
  "minecraft:acacia_door",
  "minecraft:acacia_trapdoor",
  "minecraft:acacia_button",
  "minecraft:birch_door",
  "minecraft:birch_trapdoor",
  "minecraft:birch_button",
  "minecraft:crimson_door",
  "minecraft:crimson_trapdoor",
  "minecraft:crimson_button",
  "minecraft:dark_oak_door",
  "minecraft:dark_oak_trapdoor",
  "minecraft:dark_oak_button",
  "minecraft:jungle_door",
  "minecraft:jungle_trapdoor",
  "minecraft:jungle_button",
  "minecraft:mangrove_door",
  "minecraft:mangrove_trapdoor",
  "minecraft:mangrove_button",
  "minecraft:spruce_door",
  "minecraft:spruce_trapdoor",
  "minecraft:spruce_button",
  "minecraft:warped_door",
  "minecraft:warped_trapdoor",
  "minecraft:warped_button",
  "minecraft:wooden_door",
  "minecraft:wooden_button",
  "minecraft:trapdoor",
  "minecraft:iron_door",
  "minecraft:iron_trapdoor",
  "minecraft:polished_blackstone_button",
  "minecraft:lever",
];

/**
 * A List of all containers a item could be in
 */
export const BLOCK_CONTAINERS = [
  "minecraft:chest",
  "minecraft:ender_chest",
  "minecraft:barrel",
  "minecraft:trapped_chest",
  "minecraft:dispenser",
  "minecraft:dropper",
  "minecraft:furnace",
  "minecraft:blast_furnace",
  "minecraft:lit_furnace",
  "minecraft:lit_blast_furnace",
  "minecraft:hopper",
  "minecraft:shulker_box",
  "minecraft:undyed_shulker_box",
];
