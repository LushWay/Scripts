import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { ActionForm } from 'lib/form/action'
import { showForm } from 'lib/form/utils'
import { Quest } from 'lib/quest'
import { MaybeRawText, t } from 'lib/text'
import { util } from 'lib/util'

export type NewFormCallback = (player: Player, back?: NewFormCallback) => void | Promise<void | boolean>

class Form {
  constructor(private player: Player) {
    this.form.title('§c§o§m§m§o§n§r§fForm')
  }

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

  private buttons: (NewFormCallback | undefined)[] = []

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param callback - What happens when this button is clicked
   */
  button(text: MaybeRawText, callback: NewFormCallback): F

  /** Adds a button to this form */
  button(link: ShowForm, icon?: string | null): F

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPath - Textures/ui/plus
   * @param callback - What happens when this button is clicked
   */
  button(text: MaybeRawText, iconPath: string | null | undefined, callback: NewFormCallback | ShowForm): F

  /**
   * Adds a button to this form
   *
   * @param textOrForm - Text to show on this button
   * @param callbackOrIcon - The path this button icon
   * @param callback - What happens when this button is clicked
   */
  button(
    textOrForm: MaybeRawText | ShowForm,
    callbackOrIcon: string | null | undefined | NewFormCallback,
    callbackOrUndefined?: NewFormCallback | ShowForm,
  ): F {
    let text, icon, callback

    if (textOrForm instanceof ShowForm) {
      text = textOrForm.title(this.player)
      callback = textOrForm.show
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
    this.buttons.push(callback instanceof ShowForm ? callback.show : callback)
    return this
  }

  qbutton(quest: Quest, textOverride?: string) {
    const rendered = quest.button.render(this.player, () => this.show())
    if (!rendered) return

    this.button(textOverride ?? rendered[0], rendered[1], rendered[2])
  }

  show = async () => {
    if (!this.buttons.length) this.button('Пусто', undefined, this.show)

    const response = await showForm(this.form, this.player)
    if (response === false || !(response instanceof ActionFormResponse) || typeof response.selection === 'undefined')
      return

    const callback = this.buttons[response.selection]
    if (typeof callback === 'function') await util.catch(() => callback(this.player, this.show) as void)
  }
}

type F = Omit<Form, 'show' | 'currentTitle'>
type CreateForm = (form: F, player: Player, back?: NewFormCallback) => void

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
}
