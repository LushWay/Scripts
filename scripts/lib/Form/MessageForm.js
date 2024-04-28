import { Player } from '@minecraft/server'
import { MessageFormData, MessageFormResponse } from '@minecraft/server-ui'
import { util } from '../util.js'
import { showForm } from './utils.js'

export class MessageForm {
  /**
   * The title that this form should have
   *
   * @type {string}
   */
  title

  /**
   * Extra text that should be displayed in the form
   *
   * @type {string}
   */
  body

  /**
   * The default minecraft form this form is based on
   *
   * @private
   * @type {MessageFormData}
   */
  form

  /**
   * The first button of the dialog.
   *
   * @private
   * @type {IMessageFormButton}
   */
  button1

  /**
   * The seccond button of the dialog.
   *
   * @private
   * @type {IMessageFormButton}
   */
  button2

  /**
   * Creates a new form to be shown to a player
   *
   * @param {string} title The title that this form should have
   * @param {string} body Extra text that should be displayed in the form
   */
  constructor(title, body) {
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
  setButton1(text, callback) {
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
  setButton2(text, callback) {
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
  async show(player) {
    const response = await showForm(this.form, player)
    if (response === false || !(response instanceof MessageFormResponse)) return

    const callback = this[response.selection ? 'button1' : 'button2'].callback
    if (callback) util.catch(callback)
  }
}

/**
 * Asks player
 *
 * @param {Player} player
 * @param {string} text
 * @param {string} yesText
 * @param {VoidFunction} yesAction
 * @param {string} noText
 * @param {VoidFunction} noAction
 */
export function prompt(player, text, yesText, yesAction, noText, noAction) {
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
