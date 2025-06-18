import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { ActionForm } from 'lib/form/action'
import { ask } from 'lib/form/message'
import { showForm } from 'lib/form/utils'
import { Quest } from 'lib/quest'
import { MaybeRawText, t } from 'lib/text'
import { util } from 'lib/util'

export type NewFormCallback = (player: Player, back?: NewFormCallback) => unknown

class Form {
  constructor(private player: Player) {
    this.form.title('§c§o§m§m§o§n§r§fForm')
  }

  private form = new ActionFormData()

  currentTitle?: MaybeRawText

  title(title: MaybeRawText, prefix = '§c§o§m§m§o§n§r§f') {
    this.currentTitle = title
    this.form.title(t.raw`${prefix}${title}`)
    return this as NewFormCreator
  }

  body(body: MaybeRawText) {
    this.form.body(body)
    return this as NewFormCreator
  }

  private buttons: NewFormCallback[] = []

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param callback - What happens when this button is clicked
   */
  button(text: MaybeRawText, callback: NewFormCallback | ShowForm): NewFormCreator

  /** Adds a button to this form */
  button(link: ShowForm, icon?: string | null): NewFormCreator

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPath - Textures/ui/plus
   * @param callback - What happens when this button is clicked
   */
  button(text: MaybeRawText, iconPath: string | null | undefined, callback: NewFormCallback | ShowForm): NewFormCreator

  /**
   * Adds a button to this form
   *
   * @param textOrForm - Text to show on this button
   * @param callbackOrIcon - The path this button icon
   * @param callback - What happens when this button is clicked
   */
  button(
    textOrForm: MaybeRawText | ShowForm,
    callbackOrIcon: string | null | undefined | NewFormCallback | ShowForm,
    callbackOrUndefined?: NewFormCallback | ShowForm,
  ): NewFormCreator {
    let text, icon, callback

    if (textOrForm instanceof ShowForm) {
      text = textOrForm.title(this.player)
      callback = textOrForm.show
      if (typeof callbackOrIcon === 'string') icon = callbackOrIcon
    } else {
      text = textOrForm
    }

    if (typeof callbackOrIcon === 'function' || callbackOrIcon instanceof ShowForm) {
      callback = callbackOrIcon
    } else {
      icon = callbackOrIcon
      callback = callbackOrUndefined
      if (!callback && textOrForm instanceof ShowForm) callback = textOrForm
    }

    const finalCallback = callback instanceof ShowForm ? callback.show : callback
    if (!finalCallback) throw new TypeError(`No callback`)

    this.form.button(text, icon ?? undefined)
    this.buttons.push(finalCallback)
    return this
  }

  quest(quest: Quest, textOverride?: string, descriptionOverride?: string) {
    const rendered = quest.button.render(this.player, () => this.show(), descriptionOverride)
    if (!rendered) return

    this.button(textOverride && rendered[0] === quest.name ? textOverride : rendered[0], rendered[1], rendered[2])
  }

  /**
   * Adds ask button to the form. Alias to {@link Form.button}
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
  ask(text: string, yesText: string, yesAction: VoidFunction, noText = 'Отмена', texture: string | null = null) {
    return this.button(text, texture, p =>
      ask(p, '§cВы уверены, что хотите ' + text + '?', yesText, yesAction, noText, this.show),
    )
  }

  show = async () => {
    const callbackExecutor: (fn: VoidFunction) => void = __TEST__ ? f => f() : util.catch

    if (!this.buttons.length) this.button('Пусто', undefined, this.show)

    const response = await showForm(this.form, this.player)
    if (response === false || !(response instanceof ActionFormResponse) || typeof response.selection === 'undefined')
      return

    const callback = this.buttons[response.selection]
    if (typeof callback === 'undefined')
      throw new TypeError(
        `Callback for ${response.selection} does not exists, only ${this.buttons.length} callbacks are available`,
      )

    if (typeof callback === 'function') {
      return callbackExecutor(() => callback(this.player, this.show))
    }
  }
}

export type NewFormCreator = Omit<Form, 'show' | 'currentTitle'>
type CreateForm = (form: NewFormCreator, player: Player, back?: NewFormCallback) => void

export function form(create: CreateForm) {
  return new ShowForm(create)
}

export class ShowForm {
  constructor(private create: CreateForm) {}

  show: NewFormCallback = async (player, back) => {
    const form = new Form(player)
    if (back) {
      form.button(ActionForm.backText, back)
    }

    this.create(form, player, back)
    return form.show()
  }

  title(player: Player) {
    const form = new Form(player)
    this.create(form, player)
    return form.currentTitle ?? 'No title'
  }

  get command() {
    return (ctx: import('lib/command/context').CommandContext) => this.show(ctx.player)
  }
}
