import { MinecraftDimensionTypes, world } from "@minecraft/server";

const O = world.getDimension(MinecraftDimensionTypes.overworld);
const N = world.getDimension(MinecraftDimensionTypes.nether);
const E = world.getDimension(MinecraftDimensionTypes.theEnd);

export const DIMENSIONS = {
	"minecraft:overworld": O,
	overworld: O,
	"minecraft:nether": N,
	nether: N,
	"minecraft:the_end": E,
	the_end: E,
};

