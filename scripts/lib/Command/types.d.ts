import { Player } from "@minecraft/server";
import { XCommand } from "./Command.js";

export interface ICommandData {
	/**
	 * The name of the command
	 * @example "ban"
	 */
	name: string;
	/**
	 * How this command works
	 * @example "Bans a player"
	 */
	description?: string;
	/**
	 * Other names that can call this command
	 * @example ```["f", "s"]```
	 * @example ```["f"]```
	 */
	aliases?: string[];
	/**
	 * A function that will determine if a player has permission to use this command
	 * @param player this will return the player that uses this command
	 * @returns if this player has permission to use this command
	 * @example ```
	 * (player) => player.hasTag("admin")
	 * ```
	 */
	requires?: (player: Player) => boolean;
	/**
	 * The message that will be send if a player doest have permission to use this command
	 * Its good to explain why this failed here
	 * @example "You can only run this command in the overworld"
	 * @example "You are not a admin"
	 * @example "You have failed to meet the required paramaters for this command"
	 */
	invaildPermission?: string;
  type?: string;
}

export type AppendArgument<Base, Next> = Base extends (ctx: infer X, ...args: infer E) => infer R
	? (ctx: X, ...args: [...E, Next]) => R
	: never;

export type ArgReturn<Callback extends any, type extends any> = XCommand<AppendArgument<Callback, type>>;
