import { BeforeChatEvent, Player } from "@minecraft/server";
export class CommandContext {
    /**
     * Returns a commands callback
     * @param {BeforeChatEvent} data chat data that was used
     * @param {string[]} args
     */
    constructor(data, args) {
        this.data = data;
        this.sender = data.sender;
        this.args = args;
    }
    /**
     * Replys to the sender of a command callback
     * @param {any} text Message or a lang code
     * @example ctx.reply('Hello World!');
     */
    reply(text) {
        this.sender.tell(text + "");
    }
    /**
     * Replys to the sender of a command callback
     * @param {any} errorText Message or a lang code
     * @example ctx.reply('Hello World!');
     */
    error(errorText) {
        this.sender.tell(`§c${errorText}`);
    }
}
