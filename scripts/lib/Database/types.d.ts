import { World, Player } from "@minecraft/server";
import { CONFIG_DB } from "config.js";

type Source = World | Player;

type DBkey<S> = S extends Player
	? keyof typeof CONFIG_DB.player
	: S extends World
	? keyof typeof CONFIG_DB.world
	: never;

type DBvalue = string | boolean | number | Array | Object | undefined;
