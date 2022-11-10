import { world } from "@minecraft/server";

export const O = world.getDimension("overworld");

export const DIMENSIONS = {
  "minecraft:overworld": O,
  overworld: O,
};
