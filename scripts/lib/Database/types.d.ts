import { World, Player } from "@minecraft/server";
import { CONFIGDB } from "config.js";

export type Source = World | Player;

export namespace DBkey {
  type player = keyof typeof CONFIGDB.player;
  type world = keyof typeof CONFIGDB.world;
}

export type DBvalue = string | boolean | number | undefined;
