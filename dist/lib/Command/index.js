import { BeforeChatEvent, world } from "@minecraft/server";
import { CONFIG } from "../../config.js";
import { IS } from "../../xapi.js";
import { ArrayArgumentType, BooleanArgumentType, IArgumentType, IntegerArgumentType, LiteralArgumentType, LocationArgumentType, StringArgumentType, } from "./ArgumentTypes.js";
import { CommandContext } from "./Callback.js";
import "./index.js";
import { commandNotFound, commandSyntaxFail, getChatAugments, noPerm, sendCallback, } from "./utils.js";
/**
 *  @template {Function} [Callback = (ctx: CommandContext) => void]
 */
export class XCommand {
    /**
     * @param {BeforeChatEvent} data
     */
    static chatListener(data) {
        if (!data.message.startsWith(CONFIG.commandPrefix))
            return; // This is not a command
        data.cancel = true;
        const [cmd, ...args] = getChatAugments(data.message, CONFIG.commandPrefix);
        const command = XCommand.COMMANDS.find((c) => c.sys.data.name === cmd || c.sys.data.aliases?.includes(cmd));
        if (!command)
            return commandNotFound(data.sender, cmd);
        if (!command.sys.data?.requires(data.sender))
            return noPerm(data.sender, command);
        /**
         * Check Args/SubCommands for errors
         * @type {XCommand[]}
         */
        const verifiedCommands = [];
        /**
         * @param {XCommand<any>} start
         * @param {number} i
         * @returns {string}
         */
        function getArg(start, i) {
            if (start.sys.children.length > 0) {
                const arg = start.sys.children.find((v) => v.sys.type.matches(args[i]).success || (!args[i] && v.sys.type.optional));
                if (!arg && !args[i] && start.sys.callback)
                    return;
                if (!arg)
                    return commandSyntaxFail(data.sender, command, args, i), "fail";
                if (!arg.sys.data?.requires(data.sender))
                    return noPerm(data.sender, arg), "fail";
                verifiedCommands.push(arg);
                return getArg(arg, i + 1);
            }
        }
        if (getArg(command, 0))
            return;
        sendCallback(args, verifiedCommands, data, command);
    }
    /**
     *
     * @param {import("./types.js").ICommandData} data
     * @param {IArgumentType} [type]
     * @param {number} [depth]
     * @param {XCommand<any>} [parent]
     */
    constructor(data, type, depth = 0, parent = null) {
        data.requires ?? (data.requires = () => true);
        data.type ?? (data.type = "test");
        if ("require" in data)
            data.requires = (p) => IS(p.id, data.require);
        this.sys = {};
        /**
             * @type {import("./types.js").ICommandData}
             * @private
             */
        this.sys.data = data;
        /**
         * @type {IArgumentType}
         */
        this.sys.type = type ?? new LiteralArgumentType(data.name);
        /**
         * The Arguments on this command
         * @type {XCommand<any>[]}
         */
        this.sys.children = [];
        /**
         * @type {number}
         */
        this.sys.depth = depth;
        /**
         * @type {XCommand<any>}
         */
        this.sys.parent = parent;
        /**
         * Function to run when this command is called
         * @type {Callback}
         */
        this.sys.callback = null;
        if (depth === 0)
            XCommand.COMMANDS.push(this);
    }
    /**
     * Adds a ranch to this command of your own type
     * @template {IArgumentType} T
     * @param {T} type a special type to be added
     * @returns {import("./types.js").ArgReturn<Callback, T['type']>} new branch to this command
     * @private
     */
    argument(type) {
        const cmd = new XCommand(this.sys.data, type, this.sys.depth + 1, this);
        this.sys.children.push(cmd);
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
            const newArg = cmd
                .location(name + "_y*", optional)
                .location(name + "_z*", optional);
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
        const cmd = new XCommand(data, new LiteralArgumentType(data.name, optional), this.sys.depth + 1, this);
        this.sys.children.push(cmd);
        // @ts-expect-error
        return cmd;
    }
    /**
     * Registers this command and its apendending arguments
     * @param {Callback} callback what to run when this command gets called
     * @returns {XCommand<Callback>}
     */
    executes(callback) {
        this.sys.callback = callback;
        return this;
    }
}
/**
 * An array of all active commands
 * @type {import("./index.js").XCommand<any>[]}
 */
XCommand.COMMANDS = [];
world.events.beforeChat.subscribe(XCommand.chatListener);