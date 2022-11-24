import { MinecraftDimensionTypes, world } from "@minecraft/server";

export const O = world.getDimension(MinecraftDimensionTypes.overworld);
export const N = world.getDimension(MinecraftDimensionTypes.nether);
export const E = world.getDimension(MinecraftDimensionTypes.theEnd);

export const DIMENSIONS = {
	"minecraft:overworld": O,
	overworld: O,
	"minecraft:nether": N,
	nether: N,
	"minecraft:the_end": E,
	the_end: E,
};
