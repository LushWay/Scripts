import { Player } from '@minecraft/server'
import { MessageFormData, MessageFormResponse } from '@minecraft/server-ui'
import { MaybeRawText } from 'lib/text'
import { util } from '../util'
import { showForm } from './utils'

interface IMessageFormButton {
  /** Text that gets displayed on the button */
  text: string
  /** What gets called when this gets clicked */
  callback?: VoidFunction
}

export class MessageForm {
  triedToShow

  /** The default minecraft form this form is based on */
  private form: MessageFormData

  /** The first button of the dialog. */

  private button1?: IMessageFormButton

  /** The seccond button of the dialog. */

  private button2?: IMessageFormButton

  /**
   * Creates a new form to be shown to a player
   *
   * @param title The title that this form should have
   * @param body Extra text that should be displayed in the form
   */
  constructor(title: MaybeRawText, body: MaybeRawText) {
    this.form = new MessageFormData()
    if (title) this.form.title(title)
    if (body) this.form.body(body)
    this.setButton2('Ок', () => 0)
    this.setButton1('', () => 0)
    this.triedToShow = 0
  }

  /**
   * Method that sets the text for the first button of the dialog.
   *
   * @example
   *   ;```
   *   setButton1("settings", () => {})
   *   ```
   *
   * @param text Text to show on this button
   * @param callback What happens when this button is clicked
   */
  setButton1(text: string, callback: VoidFunction): MessageForm {
    this.button1 = { text: text, callback: callback }
    this.form.button2(text)
    return this
  }

  /**
   * Method that sets the text for the second button of the dialog.
   *
   * @example
   *   ;```
   *   setButton2("settings", () => {})
   *   ```
   *
   * @param text Text to show on this button
   * @param callback What happens when this button is clicked
   */
  setButton2(text: string, callback: VoidFunction): MessageForm {
    this.button2 = { text: text, callback: callback }
    this.form.button1(text)
    return this
  }

  /**
   * Shows this form to the player
   *
   * @param player Player to show to
   */
  async show(player: Player): Promise<void> {
    const response = await showForm(this.form, player)
    if (response === false || !(response instanceof MessageFormResponse)) return

    const callback = this[response.selection ? 'button1' : 'button2']?.callback
    if (callback) util.catch(callback)
  }
}

/** Shows MessageForm to the player */
export function ask(
  player: Player,
  text: string,
  yesText: string,
  yesAction?: VoidFunction,
  noText = 'Отмена',
  noAction?: VoidFunction,
) {
  return new Promise<boolean>(resolve => {
    new MessageForm('Вы уверены?', text)
      .setButton1(yesText, () => {
        yesAction?.()
        resolve(true)
      })
      .setButton2(noText, () => {
        noAction?.()
        resolve(false)
      })
      .show(player)
  })
}
