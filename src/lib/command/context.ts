import { ChatSendAfterEvent, Player } from '@minecraft/server'
import { SOUNDS } from 'lib/assets/config'

export class CommandContext {
  input

  event: ChatSendAfterEvent

  player: Player

  arguments: string[]

  command: import('./index').Command

  /**
   * Returns a commands callback
   *
   * @param event Chat data that was used
   * @param args
   * @param command
   * @param rawInput
   */
  constructor(event: ChatSendAfterEvent, args: string[], command: import('./index').Command, rawInput: string) {
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
   * @param text Message or a lang code
   */
  reply(text: unknown) {
    this.player.tell(text + '')
    this.player.playSound(SOUNDS.click)
  }

  /**
   * Replys to the sender of a command callback
   *
   * @param errorText - Text to send
   */
  error(errorText: string) {
    this.player.fail(errorText)
  }
}
