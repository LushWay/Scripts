import { IS } from "../../xapi.js";
import {
	ArrayArgumentType,
	BooleanArgumentType,
	IArgumentType,
	IntegerArgumentType,
	LiteralArgumentType,
	LocationArgumentType,
	StringArgumentType,
} from "./ArgumentTypes.js";
import { CommandContext } from "./Callback.js";
import { __COMMANDS__ } from "./index.js";

/**
 *  @template {Function} [Callback = (ctx: CommandContext) => void]
 */
export class XCommand {
	/**
	 * The Arguments on this command
	 * @type {XCommand<any>[]}
	 */
	children;

	/**
	 * Function to run when this command is called
	 * @type {Callback}
	 */
	callback;
	/**
	 *
	 * @param {import("./types.js").ICommandData} data
	 * @param {IArgumentType} [type]
	 * @param {number} [depth]
	 * @param {XCommand<any>} [parent]
	 */
	constructor(data, type, depth, parent) {
		data.requires ??= () => true;
		data.type ??= "test";
		if ("require" in data) data.requires = (p) => IS(p.id, data.require);

		this.data = data;
		this.type = type ?? new LiteralArgumentType(data.name);
		this.children = [];
		this.depth = depth ?? 0;
		this.parent = parent ?? null;
		this.callback = null;

		if (depth === 0) __COMMANDS__.push(this);
	}

	/**
	 * Adds a ranch to this command of your own type
	 * @param {T} type a special type to be added
	 * @returns {import("./types.js").ArgReturn<Callback, T['type']>} new branch to this command
	 * @template {IArgumentType} T
	 * @private
	 */
	argument(type) {
		const cmd = new XCommand(this.data, type, this.depth + 1, this);
		this.children.push(cmd);
		// @ts-expect-error
		return cmd;
	}
	/**
	 * Adds a branch to this command of type string
	 * @param {string} name name this argument should have
	 * @returns new branch to this command
	 */
	string(name, optional = false) {
		return this.argument(new StringArgumentType(name, optional));
	}
	/**
	 * Adds a branch to this command of type string
	 * @param {string} name name this argument should have
	 * @returns new branch to this command
	 */
	int(name, optional = false) {
		return this.argument(new IntegerArgumentType(name, optional));
	}
	/**
	 * Adds a branch to this command of type string
	 * @param {string} name name this argument should have
	 * @param {T} types
	 * @returns {import("./types.js").ArgReturn<Callback, T[number]>} new branch to this command
	 * @template {ReadonlyArray<string>} T
	 */
	array(name, types, optional = false) {
		return this.argument(new ArrayArgumentType(name, types, optional));
	}
	/**
	 * Adds a branch to this command of type string
	 * @param {string} name name this argument should have
	 * @returns new branch to this command
	 */
	boolean(name, optional = false) {
		return this.argument(new BooleanArgumentType(name, optional));
	}
	/**
	 * Adds a branch to this command of type string
	 * @param {string} name name this argument should have
	 * @returns {import("./types.js").ArgReturn<Callback, Vector3>} new branch to this command
	 */
	location(name, optional = false) {
		const cmd = this.argument(new LocationArgumentType(name, optional));
		if (!name.endsWith("*")) {
			const newArg = cmd.location(name + "_y*", optional).location(name + "_z*", optional);
			// @ts-expect-error
			return newArg;
		}
		return cmd;
	}
	/**
	 * Adds a subCommand to this argument
	 * @param {import("./types.js").ICommandData} data name this literal should have
	 * @returns {XCommand<Callback>} new branch to this command
	 */
	literal(data, optional = false) {
		const cmd = new XCommand(data, new LiteralArgumentType(data.name, optional), this.depth + 1, this);
		this.children.push(cmd);
		// @ts-expect-error
		return cmd;
	}
	/**
	 * Registers this command and its apendending arguments
	 * @param {Callback} callback what to run when this command gets called
	 * @returns {XCommand<Callback>}
	 */
	executes(callback) {
		this.callback = callback;
		return this;
	}
}
