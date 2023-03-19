/**
 *  @template {Function} [Callback = (ctx: CommandContext) => void]
 */
export class XCommand<Callback extends Function = (ctx: CommandContext) => void> {
    /**
     * @param {BeforeChatEvent} data
     */
    static chatListener(data: BeforeChatEvent): void;
    /**
     * An array of all active commands
     * @type {import("./index.js").XCommand<any>[]}
     */
    static COMMANDS: import("./index.js").XCommand<any>[];
    /**
     *
     * @param {import("./types.js").ICommandData} data
     * @param {IArgumentType} [type]
     * @param {number} [depth]
     * @param {XCommand<any>} [parent]
     */
    constructor(data: import("./types.js").ICommandData, type?: IArgumentType, depth?: number, parent?: XCommand<any>);
    sys: {};
    /**
     * Adds a ranch to this command of your own type
     * @template {IArgumentType} T
     * @param {T} type a special type to be added
     * @returns {import("./types.js").ArgReturn<Callback, T['type']>} new branch to this command
     * @private
     */
    private argument;
    /**
     * Adds a branch to this command of type string
     * @param {string} name name this argument should have
     * @returns new branch to this command
     */
    string(name: string, optional?: boolean): import("./types.js").ArgReturn<Callback, string>;
    /**
     * Adds a branch to this command of type string
     * @param {string} name name this argument should have
     * @returns new branch to this command
     */
    int(name: string, optional?: boolean): import("./types.js").ArgReturn<Callback, number>;
    /**
     * Adds a branch to this command of type string
     * @param {string} name name this argument should have
     * @param {T} types
     * @returns {import("./types.js").ArgReturn<Callback, T[number]>} new branch to this command
     * @template {ReadonlyArray<string>} T
     */
    array<T extends readonly string[]>(name: string, types: T, optional?: boolean): import("./types.js").ArgReturn<Callback, T[number]>;
    /**
     * Adds a branch to this command of type string
     * @param {string} name name this argument should have
     * @returns new branch to this command
     */
    boolean(name: string, optional?: boolean): import("./types.js").ArgReturn<Callback, boolean>;
    /**
     * Adds a branch to this command of type string
     * @param {string} name name this argument should have
     * @returns {import("./types.js").ArgReturn<Callback, Vector3>} new branch to this command
     */
    location(name: string, optional?: boolean): import("./types.js").ArgReturn<Callback, Vector3>;
    /**
     * Adds a subCommand to this argument
     * @param {import("./types.js").ICommandData} data name this literal should have
     * @returns {XCommand<Callback>} new branch to this command
     */
    literal(data: import("./types.js").ICommandData, optional?: boolean): XCommand<Callback>;
    /**
     * Registers this command and its apendending arguments
     * @param {Callback} callback what to run when this command gets called
     * @returns {XCommand<Callback>}
     */
    executes(callback: Callback): XCommand<Callback>;
}
import { CommandContext } from "./Callback.js";
import { BeforeChatEvent } from "@minecraft/server";
import { IArgumentType } from "./ArgumentTypes.js";
