import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { showForm, util } from 'lib'
import { MaybeRawText, t } from 'lib/text'

type FormCallback<T extends any[] = []> = (player: Player, back?: FormCallback, ...args: T) => void

class Form {
  constructor(
    private self: FormCallback,
    private player: Player,
  ) {}

  private form = new ActionFormData()

  currentTitle?: MaybeRawText

  title(title: MaybeRawText, prefix = '§c§o§m§m§o§n§r§f') {
    this.currentTitle = title
    this.form.title(t.raw`${prefix}${title}`)
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
      text = textOrForm.title(this.player)
      callback = textOrForm.show
      if (typeof callbackOrIcon === 'string') icon = callbackOrIcon
    } else {
      text = textOrForm
    }

    if (typeof callbackOrIcon === 'function') {
      callback = callbackOrIcon
    } else if (typeof callbackOrIcon === 'string') {
      icon = callbackOrIcon
      callback = callbackOrUndefined
    }

    this.form.button(text, icon ?? undefined)
    this.buttons.push(callback)
    return this
  }

  async show() {
    if (!this.buttons.length) this.button('Пусто', undefined, () => this.show())

    const response = await showForm(this.form, this.player)
    if (response === false || !(response instanceof ActionFormResponse) || typeof response.selection === 'undefined')
      return

    const callback = this.buttons[response.selection]
    if (typeof callback === 'function') util.catch(() => callback(this.player, this.self))
  }
}

type F = Omit<Form, 'show' | 'currentTitle'>
type CreateForm<T extends any[]> = (form: F, player: Player, ...args: T) => void

export function form<T extends any[]>(create: CreateForm<T>) {
  return new Show(create)
}

class Show<T extends any[] = []> {
  constructor(private create: CreateForm<T>) {}

  show: FormCallback<T> = (player, back, ...args) => {
    const form = new Form(this.show, player)
    if (back) form.button('Back', undefined, back)

    this.create(form, player, ...args)
    return form.show()
  }

  title(player: Player, ...args: T) {
    const form = new Form(this.show, player)
    this.create(form, player, ...args)
    return form.currentTitle ?? 'No title'
  }
}
