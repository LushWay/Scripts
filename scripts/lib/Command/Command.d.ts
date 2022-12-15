import { Location } from "@minecraft/server";
import { IArgumentType } from "./ArgumentTypes.js";
import { CommandCallback } from "./Callback.js";
import { ArgReturn, ICommandData } from "./types.js";
export { ArgumentTypes } from "./ArgumentTypes.js";

export class XCommand<
	Callback extends Function = (ctx: CommandCallback) => void
> {
	/**
	 * The Arguments on this command
	 */
	children: XCommand<any>[];

	/**
	 * Function to run when this command is called
	 */
	callback: Callback;

	constructor(
		public data: ICommandData,
		public type?: IArgumentType,
		public depth: number = 0,
		public parent?: XCommand<any>
	);

	/**
	 * Adds a ranch to this command of your own type
	 * @param type a special type to be added
	 * @returns new branch to this command
	 */
	argument<T extends IArgumentType>(type: T): ArgReturn<Callback, T["type"]>;

	/**
	 * Adds a branch to this command of type string
	 * @param name name this argument should have
	 * @returns new branch to this command
	 */
	string(name: string, optional?: boolean): ArgReturn<Callback, string>;

	/**
	 * Adds a branch to this command of type string
	 * @param name name this argument should have
	 * @returns new branch to this command
	 */
	int(name: string, optional?: boolean): ArgReturn<Callback, number>;

	/**
	 * Adds a branch to this command of type string
	 * @param name name this argument should have
	 * @returns new branch to this command
	 */
	array<T extends ReadonlyArray<string>>(
		name: string,
		types: T,
		optional?: boolean
	): ArgReturn<Callback, T[number]>;

	/**
	 * Adds a branch to this command of type string
	 * @param name name this argument should have
	 * @returns new branch to this command
	 */
	boolean(name: string, optional?: boolean): ArgReturn<Callback, boolean>;

	/**
	 * Adds a argument to this command to add 3 parameters with location types and to return a Location
	 * @param name name this argument  should have
	 * @returns new branch to this command
	 */
	location(name: string, optional?: boolean): ArgReturn<Callback, Vector3>;

	/**
	 * Adds a subCommand to this argument
	 * @param name name this literal should have
	 * @returns new branch to this command
	 */
	literal(data: ICommandData, optional?: boolean): XCommand<Callback>;

	/**
	 * Registers this command and its apendending arguments
	 * @param callback what to run when this command gets called
	 */
	executes(callback: Callback): XCommand<Callback>;
}
