import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { ActionForm } from 'lib/form/action'
import { ask } from 'lib/form/message'
import { showForm } from 'lib/form/utils'
import { Message } from 'lib/i18n/message'
import { i18n, noI18n } from 'lib/i18n/text'
import { Quest } from 'lib/quest'
import { doNothing, util } from 'lib/util'

export type NewFormCallback = (player: Player, back?: NewFormCallback) => unknown

export interface FormContext<T extends FormParams> {
  player: Player
  back?: NewFormCallback
  self: VoidFunction
  params: T
}

type FormParams = Record<string, unknown> | undefined
export type NewFormCreator = Omit<Form, 'show' | 'currentTitle'>

type CreateForm<T extends FormParams = undefined> = (form: NewFormCreator, ctx: FormContext<T>) => void

class Form {
  constructor(private player: Player) {
    this.form.title('§c§o§m§m§o§n§r§fForm')
  }

  private form = new ActionFormData()

  currentTitle?: Text

  title(title: Text, prefix = '§c§o§m§m§o§n§r§f') {
    this.currentTitle = title
    this.form.title(`${prefix}${title.to(this.player.lang)}`)
    return this as NewFormCreator
  }

  body(body: Text) {
    this.form.body(body.to(this.player.lang))
    return this as NewFormCreator
  }

  private buttons: NewFormCallback[] = []

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param callback - What happens when this button is clicked
   */
  button(text: Text, callback: NewFormCallback | ShowForm): NewFormCreator

  /** Adds a button to this form */
  button(link: ShowForm, icon?: string | null): NewFormCreator

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPath - Textures/ui/plus
   * @param callback - What happens when this button is clicked
   */
  button(text: Text, iconPath: string | null | undefined, callback: NewFormCallback | ShowForm): NewFormCreator

  /**
   * Adds a button to this form
   *
   * @param textOrForm - Text to show on this button
   * @param callbackOrIcon - The path this button icon
   * @param callback - What happens when this button is clicked
   */
  button(
    textOrForm: Text | ShowForm,
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

    this.form.button(text.to(this.player.lang), icon ?? undefined)
    this.buttons.push(finalCallback)
    return this
  }

  quest(quest: Quest, textOverride?: Text, descriptionOverride?: Text) {
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
  // TODO Fix
  ask(text: Text, yesText: Text, yesAction: VoidFunction, noText: Text = i18n`Отмена`, texture: string | null = null) {
    return this.button(text, texture, p =>
      ask(p, i18n.error`Вы уверены, что хотите ${text}?`, yesText, yesAction, noText, this.show),
    )
  }

  show = async () => {
    const callbackExecutor: (fn: VoidFunction) => void = __TEST__ ? f => f() : util.catch

    if (!this.buttons.length) this.button(noI18n`Empty`, undefined, this.show)

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

export function form(create: CreateForm) {
  return new ShowForm(create, undefined)
}

form.params = <T extends FormParams>(create: CreateForm<T>) => {
  return (params: T) => new ShowForm<T>(create, params) as unknown as ShowForm
}

// TODO
form.array = doNothing

export class ShowForm<T extends FormParams = undefined> {
  constructor(
    private create: CreateForm<T>,
    private params: T,
  ) {}

  show: NewFormCallback = async (player, back) => {
    const form = new Form(player)
    if (back) form.button(ActionForm.backText, back)

    this.create(form, { player, back, params: this.params, self: () => this.show(player, back) })
    return form.show()
  }

  title(player: Player) {
    const form = new Form(player)
    this.create(form, { player, back: doNothing, params: this.params, self: doNothing })
    return form.currentTitle ?? 'No title'
  }

  get command() {
    return (ctx: import('lib/command/context').CommandContext) => this.show(ctx.player)
  }
}
