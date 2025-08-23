import { ChatSendAfterEvent, Player } from '@minecraft/server'
import { Sounds } from 'lib/assets/custom-sounds'
import { Message } from 'lib/i18n/message'

export class CommandContext {
  player: Player

  /**
   * Returns a commands callback
   *
   * @param event Chat data that was used
   * @param args
   * @param command
   * @param input
   */
  constructor(
    public event: ChatSendAfterEvent,
    public args: string[],
    public command: import('./index').Command,

    /**
     * Raw arguments of the command
     *
     * For `/give somebody apples` its `somebody apples`
     *
     * For `/help` its ``
     */
    public input: string,
  ) {
    this.player = event.sender
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
    this.player.tell(text instanceof Message ? text : `${text}`)
    this.player.playSound(Sounds.Click)
  }

  /**
   * Replys to the sender of a command callback
   *
   * @param errorText - Text to send
   */
  error(errorText: Text) {
    this.player.fail(errorText)
  }
}
