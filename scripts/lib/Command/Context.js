import { ChatSendAfterEvent, Player } from '@minecraft/server'
import { SOUNDS } from 'lib/Assets/config.js'

export class CommandContext {
  /** @type {ChatSendAfterEvent} */
  event

  /** @type {Player} */
  player

  /** @type {string[]} */
  arguments

  /** @type {import('./index.js').Command} */
  command

  /**
   * Returns a commands callback
   *
   * @param {ChatSendAfterEvent} event Chat data that was used
   * @param {string[]} args
   * @param {import('./index.js').Command} command
   * @param {string} rawInput
   */
  constructor(event, args, command, rawInput) {
    this.event = event
    this.player = event.sender
    this.command = command
    this.arguments = args
    this.input = rawInput
  }

  /**
   * Replys to the sender of a command callback
   *
   * @example
   *   ctx.reply('Hello World!')
   *
   * @param {any} text Message or a lang code
   */
  reply(text) {
    this.player.tell(text + '')
    this.player.playSound(SOUNDS.click)
  }

  /**
   * Replys to the sender of a command callback
   *
   * @param {any} errorText - Text to send
   */
  error(errorText) {
    this.player.fail(errorText)
  }
}
