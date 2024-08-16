import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { showForm, util } from 'lib'
import { MaybeRawText } from 'lib/text'

type FormCallback = (player: Player, back?: FormCallback) => void

class Form {
  constructor(private back: FormCallback) {}

  private form = new ActionFormData()

  currentTitle?: MaybeRawText

  title(title: MaybeRawText) {
    this.currentTitle = title
    this.form.title(title)
    return this as F
  }

  body(body: MaybeRawText) {
    this.form.body(body)
    return this as F
  }

  private buttons: (FormCallback | undefined)[] = []

  /** Adds a button to this form */
  button(link: Show, icon?: string | null | undefined): F

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param callback - What happens when this button is clicked
   */
  button(text: MaybeRawText, callback: FormCallback): F

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPath - Textures/ui/plus
   * @param callback - What happens when this button is clicked
   */
  button(text: MaybeRawText, iconPath: string | null | undefined, callback: FormCallback): F

  /**
   * Adds a button to this form
   *
   * @param textOrForm - Text to show on this button
   * @param callbackOrIcon - The path this button icon
   * @param callback - What happens when this button is clicked
   */
  button(
    textOrForm: MaybeRawText | Show,
    callbackOrIcon: string | null | undefined | FormCallback,
    callbackOrUndefined?: FormCallback,
  ): F {
    let text, icon, callback

    if (textOrForm instanceof Show) {
      text = textOrForm.title?.() ?? '>///<'
      callback = textOrForm.show.bind(textOrForm)
      if (typeof callbackOrIcon === 'string') icon = callbackOrIcon
    } else {
      text = textOrForm
    }

    if (typeof callbackOrIcon === 'function') {
      callback = callbackOrIcon
    } else {
      icon = callbackOrIcon
      callback = callbackOrUndefined
    }

    this.form.button(text, icon ?? undefined)
    this.buttons.push(callback)
    return this
  }

  async show(player: Player) {
    if (!this.buttons.length) this.button('Пусто', undefined, () => this.show(player))

    const response = await showForm(this.form, player)
    if (response === false || !(response instanceof ActionFormResponse) || typeof response.selection === 'undefined')
      return

    const callback = this.buttons[response.selection]
    if (typeof callback === 'function') util.catch(() => callback(player, this.back))
  }
}

type Title = (title: MaybeRawText) => F
type F = Omit<Form, 'show' | 'currentTitle'>
type CreateForm = (form: Title, player: Player) => void
type CreateTitle = () => MaybeRawText

export function form(create: CreateForm, title?: CreateTitle) {
  return new Show(create, title)
}

class Show {
  constructor(
    private create: CreateForm,
    readonly title?: CreateTitle,
  ) {}

  show: FormCallback = (player, back) => {
    const form = new Form(this.show)
    if (back) form.button('Back', undefined, back)

    this.create(title => form.title(title), player)
    return form.show(player)
  }
}
