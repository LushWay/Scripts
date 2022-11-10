import { BeforeChatEvent, Player } from "@minecraft/server";
import { Log } from "xapi.js";

export class CommandCallback {
  /**
   * @type {BeforeChatEvent}
   */
  data;

  /**
   * @type {Player}
   */
  sender;

  /**
   * @type {string[]}
   */
  args;

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
}
