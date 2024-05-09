import { Player } from '@minecraft/server'

import { MessageFormData, MessageFormResponse } from '@minecraft/server-ui'
import { util } from '../util'
import { showForm } from './utils'

export class MessageForm {
  triedToShow

  /**
   * The title that this form should have
   *
   * @type {string}
   */
  title: string

  /**
   * Extra text that should be displayed in the form
   *
   * @type {string}
   */
  body: string

  /**
   * The default minecraft form this form is based on
   *
   * @private
   * @type {MessageFormData}
   */
  form: MessageFormData

  /**
   * The first button of the dialog.
   *
   * @private
   * @type {IMessageFormButton}
   */

  button1: IMessageFormButton

  /**
   * The seccond button of the dialog.
   *
   * @private
   * @type {IMessageFormButton}
   */

  button2: IMessageFormButton

  /**
   * Creates a new form to be shown to a player
   *
   * @param {string} title The title that this form should have
   * @param {string} body Extra text that should be displayed in the form
   */

  constructor(title: string, body: string) {
    this.title = title
    this.body = body
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
   * @param {string} text Text to show on this button
   * @param {ButtonCallback} callback What happens when this button is clicked
   * @returns {MessageForm}
   */

  setButton1(text: string, callback: ButtonCallback): MessageForm {
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
   * @param {string} text Text to show on this button
   * @param {ButtonCallback} callback What happens when this button is clicked
   * @returns {MessageForm}
   */

  setButton2(text: string, callback: ButtonCallback): MessageForm {
    this.button2 = { text: text, callback: callback }
    this.form.button1(text)
    return this
  }

  /**
   * Shows this form to the player
   *
   * @param {Player} player Player to show to
   * @returns {Promise<void>}
   */

  async show(player: Player): Promise<void> {
    const response = await showForm(this.form, player)
    if (response === false || !(response instanceof MessageFormResponse)) return

    const callback = this[response.selection ? 'button1' : 'button2'].callback
    if (callback) util.catch(callback)
  }
}

/** Asks player */
export function prompt(
  player: Player,
  text: string,
  yesText: string,
  yesAction: VoidFunction,
  noText: string,
  noAction: VoidFunction,
) {
  return new Promise(resolve => {
    new MessageForm('Вы уверены?', text)
      .setButton1(yesText, () => {
        yesAction()
        resolve(true)
      })
      .setButton2(noText, () => {
        noAction()
        resolve(false)
      })
      .show(player)
  })
}
