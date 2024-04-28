import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { prompt } from 'lib/Form/MessageForm.js'
import { util } from 'lib/util.js'
import { showForm } from './utils.js'

export class ActionForm {
  /** Text used by back button */
  static backText = '§l§b< §r§3Назад'

  /**
   * The buttons this form has
   *
   * @private
   * @type {IActionFormButton[]}
   */
  buttons = []

  /**
   * The default minecraft form this form is based on
   *
   * @private
   * @type {ActionFormData}
   */
  form

  /**
   * Creates a new form to be shown to a player
   *
   * @param {string} title - The title that this form should have
   * @param {string} [body] - Extra text that should be displayed in the form
   * @param {string} [prefix] - Prefix used by ui side to determine which type of form to render (e.g. it can be chestui
   *   or npc)
   */
  constructor(title, body = '', prefix = '§c§o§m§m§o§n§r§f') {
    this.form = new ActionFormData()
    this.form.title(prefix + title)
    this.form.body(body)
  }

  /**
   * @overload Adds a button to this form
   * @param {string} text - Text to show on this button
   * @param {PlayerButtonCallback} callback - What happens when this button is clicked
   * @returns {ActionForm}
   */
  /**
   * @overload Adds a button to this form
   * @param {string} text - Text to show on this button
   * @param {string | null} iconPath - Textures/ui/plus
   * @param {PlayerButtonCallback} [callback] - What happens when this button is clicked
   * @returns {ActionForm}
   */
  /**
   * Adds a button to this form
   *
   * @param {string} text - Text to show on this button
   * @param {string | null | PlayerButtonCallback} iconPathOrCallback - The path this button icon
   * @param {PlayerButtonCallback} [callback] - What happens when this button is clicked
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

  /** @param {VoidFunction} backFN */
  addButtonBack(backFN) {
    return this.addButton(ActionForm.backText, backFN)
  }

  /**
   * @param {string} text
   * @param {string} yesText
   * @param {string} noText
   * @param {ButtonCallback} yesAction
   */
  addButtonPrompt(text, yesText, yesAction, noText = 'Отмена') {
    return this.addButton(text, p =>
      prompt(p, '§cВы уверены, что хотите ' + text + '?', yesText, yesAction, noText, () => this.show(p)),
    )
  }

  /**
   * Shows this form to the player
   *
   * @param {Player} player Player to show to
   * @returns {Promise<void>}
   */
  async show(player) {
    if (!this.buttons.length) this.addButton('Пусто', () => this.show(player))

    const response = await showForm(this.form, player)
    if (response === false || !(response instanceof ActionFormResponse) || typeof response.selection === 'undefined')
      return

    const callback = this.buttons[response.selection]?.callback
    if (typeof callback === 'function') util.catch(() => callback(player))
  }
}
