import { BeforeChatEvent, Player } from "@minecraft/server";

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
   * Returns a commands callback
   * @param {BeforeChatEvent} data chat data that was used
   */
  constructor(data) {
    this.data = data;
    this.sender = data.sender;
  }
  /**
   * Replys to the sender of a command callback
   * @param {any} text Message or a lang code
   * @example ctx.reply('Hello World!');
   */
  reply(text) {
    this.sender.tell(text + '');
  }
}
