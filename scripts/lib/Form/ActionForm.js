import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { util } from 'xapi.js'
import { showForm } from './utils.js'
/** */
export class ActionForm {
  /**
   * The buttons this form has
   * @type {IActionFormButton[]}
   * @private
   */
  buttons = []
  /**
   * The default minecraft form this form is based on
   * @type {ActionFormData}
   * @private
   */
  form
  title = ''
  /**
   * Creates a new form to be shown to a player
   * @param {string} title the title that this form should have
   * @param {string} [body] extra text that should be displayed in the form
   */
  constructor(title, body = '') {
    this.form = new ActionFormData()
    this.form.title(title)
    this.title = title
    this.form.body(body)
  }
  /**
   * Adds a button to this form
   * @param {string} text  text to show on this button
   * @param {string | null | ButtonCallback} iconPathOrCallback  the path this button shows or callback
   * @param {ButtonCallback} [callback]  what happens when this button is clicked
   * @example addButton("settings", "textures/items/sum", () => {})
   * @example addButton("settings", () => {})
   * @returns {ActionForm}
   */
  addButton(text, iconPathOrCallback, callback) {
    let iconPath
    if (typeof iconPathOrCallback === 'function') {
      callback = iconPathOrCallback
      iconPath = null
    } else iconPath = iconPathOrCallback

    this.buttons.push({ text, iconPath, callback })
    this.form.button(text, iconPath ? iconPath : void 0)
    return this
  }
  /**
   * Shows this form to the player
   * @param {Player} player  player to show to
   * @returns {Promise<void>}
   */
  async show(player) {
    const response = await showForm(this.form, player)
    if (
      response === false ||
      !(response instanceof ActionFormResponse) ||
      typeof response.selection === 'undefined'
    )
      return

    const callback = this.buttons[response.selection]?.callback
    if (typeof callback === 'function') util.catch(callback)
  }
}
