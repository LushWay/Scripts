import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { prompt } from 'lib/form/message'
import { util } from 'lib/util'
import { BUTTON, showForm } from './utils'

interface IActionFormButton {
  /** Text that gets displayed on the button */
  text: string
  /** The icon that is showed with this button */
  iconPath?: string | null
  /** What gets called when this gets clicked */
  callback?: PlayerCallback
}

export class ActionForm {
  /** Text used by back button */
  static backText = '§l§b< §r§3Назад'

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
  constructor(title: string, body: string = '', prefix: string = '§c§o§m§m§o§n§r§f') {
    this.form = new ActionFormData()
    this.form.title(prefix + title)
    this.form.body(body)
  }

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param callback - What happens when this button is clicked
   */
  addButton(text: string, callback: PlayerCallback): ActionForm

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPath - Textures/ui/plus
   * @param callback - What happens when this button is clicked
   */
  addButton(text: string, iconPath: string | null, callback: PlayerCallback): ActionForm

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPathOrCallback - The path this button icon
   * @param callback - What happens when this button is clicked
   */
  addButton(text: string, iconPathOrCallback: string | null | PlayerCallback, callback?: PlayerCallback): ActionForm {
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
   * Adds back button to the form. Alias to {@link ActionForm.addButton}
   *
   * @param backCallback - Callback function that will be called when back button is pressed.
   */
  addButtonBack(backCallback: VoidFunction) {
    return this.addButton('§r§3Назад', BUTTON['<'], backCallback)
  }

  /**
   * Adds prompt button to the form. Alias to {@link ActionForm.addButton}
   *
   * Prompt is alias to {@link prompt}
   *
   * @example
   *   addButtonPrompt('§cУдалить письмо', '§cУдалить', () => deleteLetter(), 'Отмена')
   *   // Will show message form with `§cВы уверены, что хотите удалить письмо?` and `§cУдалить`, `Отмена` buttons
   *
   * @param text - ActionForm Button text. Will be also used as prompt body
   * @param yesText - PromptForm yes button text, e.g. 'Да'
   * @param yesAction - Function callback that will be called when prompt yes button was pressed
   * @param noText - PromptForm no button
   * @param texture - PromptForm texture
   */
  addButtonPrompt(
    text: string,
    yesText: string,
    yesAction: VoidFunction,
    noText: string = 'Отмена',
    texture: string | null = null,
  ) {
    return this.addButton(text, texture, p =>
      prompt(p, '§cВы уверены, что хотите ' + text + '?', yesText, yesAction, noText, () => this.show(p)),
    )
  }

  /**
   * Shows this form to the player
   *
   * @param player Player to show form to
   */
  async show(player: Player): Promise<void> {
    if (!this.buttons.length) this.addButton('Пусто', () => this.show(player))

    const response = await showForm(this.form, player)
    if (response === false || !(response instanceof ActionFormResponse) || typeof response.selection === 'undefined')
      return

    const callback = this.buttons[response.selection]?.callback
    if (typeof callback === 'function') util.catch(() => callback(player))
  }
}
