import { Player, RawMessage, RawText } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { defaultLang, Language } from 'lib/assets/lang'
import { ask } from 'lib/form/message'
import { i18n, noI18n } from 'lib/i18n/text'
import { util } from 'lib/util'
import { NewFormCallback } from './new'
import { BUTTON, showForm } from './utils'

interface IActionFormButton {
  /** Text that gets displayed on the button */
  text: string | RawMessage
  /** The icon that is showed with this button */
  iconPath?: string | null
  /** What gets called when this gets clicked */
  callback?: NewFormCallback
}

export class ActionForm {
  // TODO Remove
  /** Text used by back button */
  static backText = i18n`§l§b< §r§3Назад`

  /** The buttons this form has */
  private buttons: IActionFormButton[] = []

  /** The default minecraft form this form is based on */
  private form: ActionFormData

  /**
   * Creates a new form to be shown to a player
   *
   * @param title - The title that this form should have
   * @param body - Extra text that should be displayed in the form
   * @param prefix - Prefix used by ui side to determine which type of form to render (e.g. it can be chestui or npc)
   */
  constructor(title: string | RawText, body: string | RawText = '', prefix = '§c§o§m§m§o§n§r§f') {
    this.form = new ActionFormData()
    this.form.title({ rawtext: [{ text: prefix }, typeof title === 'string' ? { text: title } : title] })
    this.form.body(body)
  }

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param callback - What happens when this button is clicked
   */
  button(text: string | RawMessage, callback: NewFormCallback): ActionForm

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPath - Textures/ui/plus
   * @param callback - What happens when this button is clicked
   */
  button(text: string | RawMessage, iconPath: string | null | undefined, callback: NewFormCallback): ActionForm

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPathOrCallback - The path this button icon
   * @param callback - What happens when this button is clicked
   */
  button(
    text: string | RawMessage,
    iconPathOrCallback: string | null | undefined | NewFormCallback,
    callback?: NewFormCallback,
  ): ActionForm {
    let iconPath
    if (typeof iconPathOrCallback === 'function') {
      callback = iconPathOrCallback
      iconPath = null
    } else iconPath = iconPathOrCallback

    this.buttons.push({ text, iconPath, callback })
    this.form.button(text, iconPath ?? void 0)

    return this
  }

  /**
   * Adds back button to the form. Alias to {@link ActionForm.button}
   *
   * @param backCallback - Callback function that will be called when back button is pressed.
   */
  addButtonBack(backCallback: NewFormCallback | undefined, lang: Language) {
    if (!backCallback) return this
    else return this.button(i18n`§r§3Назад`.to(lang), BUTTON['<'], backCallback)
  }

  /**
   * Adds ask button to the form. Alias to {@link ActionForm.button}
   *
   * Ask is alias to {@link ask}
   *
   * @example
   *   ask('§cУдалить письмо§r', '§cУдалить§r', () => deleteLetter(), 'Отмена') //
   *   // Will show message form with `§cВы уверены, что хотите удалить письмо?` and `§cУдалить`, `Отмена` buttons
   *   §r
   *
   * @param text - Button text. Will be also used as ask body
   * @param yesText - Yes button text, e.g. 'Да'
   * @param yesAction - Function that will be called when yes button was pressed
   * @param noText - Function that will be called when no button was pressed
   * @param texture - Button texture
   */
  ask(
    text: string,
    yesText: string,
    yesAction: VoidFunction,
    noText: Text = i18n`Отмена`,
    texture: string | null = null,
  ) {
    // TODO Fix
    return this.button(text, texture, p =>
      ask(p, i18n`§cВы уверены, что хотите ${text}?`, yesText, yesAction, noText, () => this.show(p)),
    )
  }

  /**
   * Shows this form to the player
   *
   * @param player Player to show form to
   */
  async show(player: Player): Promise<boolean> {
    if (!this.buttons.length) this.button(noI18n`Empty`, () => this.show(player))

    const response = await showForm(this.form, player)

    if (response === false || !(response instanceof ActionFormResponse) || typeof response.selection === 'undefined')
      return false

    const callback = this.buttons[response.selection]?.callback
    if (typeof callback === 'function') {
      util.catch(() => callback(player, () => this.show(player)) as void)
      return true
    }

    return false
  }
}
