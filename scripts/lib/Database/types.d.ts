import { World, Player } from "@minecraft/server";
import { CONFIG_DB } from "config.js";

export type Source = World | Player;

export namespace DBkey {
	type player = keyof typeof CONFIG_DB.player;
	type world = keyof typeof CONFIG_DB.world;
}

export type DBvalue = string | boolean | number | Array | Object | undefined;
