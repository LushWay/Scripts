export class CommandContext {
    /**
     * Returns a commands callback
     * @param {BeforeChatEvent} data chat data that was used
     * @param {string[]} args
     */
    constructor(data: BeforeChatEvent, args: string[]);
    /**
     * @type {BeforeChatEvent}
     */
    data: BeforeChatEvent;
    /**
     * @type {Player}
     */
    sender: Player;
    /**
     * @type {string[]}
     */
    args: string[];
    /**
     * Replys to the sender of a command callback
     * @param {any} text Message or a lang code
     * @example ctx.reply('Hello World!');
     */
    reply(text: any): void;
    /**
     * Replys to the sender of a command callback
     * @param {any} errorText Message or a lang code
     * @example ctx.reply('Hello World!');
     */
    error(errorText: any): void;
}
import { BeforeChatEvent } from "@minecraft/server";
import { Player } from "@minecraft/server";
