import { Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse, CustomForm } from '@minecraft/server-ui'
import { defaultLang } from 'lib/assets/lang'
import { EventSignal } from 'lib/event-signal'
import { ActionForm } from 'lib/form/action'
import { ask } from 'lib/form/message'
import { showForm } from 'lib/form/utils'
import { i18n, noI18n } from 'lib/i18n/text'
import { doNothing } from 'lib/util'

export type NewFormCallback = (player: Player, back?: NewFormCallback) => unknown

export interface FormContext<T extends FormParams> {
  player: Player
  back?: NewFormCallback
  self: VoidFunction
  params: T
}

export type FormParams = Record<string, unknown> | undefined
export type FormCreator = Omit<Form, 'show' | 'currentTitle'>

type FormCreateFn<P extends FormParams = undefined> = (form: FormCreator, ctx: FormContext<P>) => void

class Form {
  constructor(private player: Player) {
    this.form.title('§c§o§m§m§o§n§r§fForm')
  }

  private form = new ActionFormData()

  private customForm?: CustomForm

  currentTitle?: Text

  title(title: Text, prefix = '§c§o§m§m§o§n§r§f') {
    this.currentTitle = title
    //if (prefix === '§c§o§m§m§o§n§r§f') {
    //  this.customForm = CustomForm.create(this.player, title.to(this.player.lang))
    //} else {
      this.form.title(`${prefix}${title.to(this.player.lang)}`)
    //}
    return this as FormCreator
  }

  body(body: Text) {
    if (this.customForm) {
      this.customForm.label(body.to(this.player.lang))
    } else {
      this.form.body(body.to(this.player.lang))
    }
    return this as FormCreator
  }

  private buttons: NewFormCallback[] = []

  private buttonText: string[] = []

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param callback - What happens when this button is clicked
   */
  button(text: Text, callback: NewFormCallback | ShowForm): FormCreator

  /** Adds a button to this form */
  button(link: ShowForm, icon?: string | null): FormCreator

  /**
   * Adds a button to this form
   *
   * @param text - Text to show on this button
   * @param iconPath - Textures/ui/plus
   * @param callback - What happens when this button is clicked
   */
  button(text: Text, iconPath: string | null | undefined, callback: NewFormCallback | ShowForm): FormCreator

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
  ): FormCreator {
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

    if (this.customForm) {
      this.customForm.button(text.to(this.player.lang), () => {
        this.executeCallback(finalCallback, text.to(defaultLang))
        this.customForm?.close()
      })
    } else {
      this.form.button(text.to(this.player.lang), icon ?? undefined)
    }
    this.buttons.push(finalCallback)
    this.buttonText.push(text.to(defaultLang))
    return this
  }

  /**
   * Adds ask button to the form. Alias to {@link button}
   *
   * Ask is alias to {@link ask}
   *
   * @example
   *   ask('§cУдалить письмо§r', '§cУдалить§r', () => deleteLetter(), 'Отмена') //
   *   // Will show message form with `§cВы уверены, что хотите удалить письмо?` and `§cУдалить`, `Отмена` buttons
   *   §r
   *
   * @param buttonText - Button text. Will be also used as ask body
   * @param explanation - Yes button text, e.g. 'Да'
   * @param yesAction - Function that will be called when yes button was pressed
   * @param noText - Function that will be called when no button was pressed
   * @param texture - Button texture
   */
  // TODO Fix
  ask(
    buttonText: Text,
    explanation: Text,
    yesAction: VoidFunction,
    noText: Text = i18n`Отмена`,
    texture: string | null = null,
  ) {
    return this.button(buttonText, texture, p => ask(p, explanation, buttonText, yesAction, noText, this.show))
  }

  protected onClose = new EventSignal()

  /** Adds listener to the onClose event when player closes form */
  close(listener: VoidFunction) {
    this.onClose.subscribe(listener)
  }

  show = async () => {
    if (!this.buttons.length) this.button(noI18n`Empty`, undefined, this.show)

    if (this.customForm) {
      await this.customForm.closeButton().show()
    } else {
      const response = await showForm(this.form, this.player)
      if (
        response === false ||
        !(response instanceof ActionFormResponse) ||
        typeof response.selection === 'undefined'
      ) {
        EventSignal.emit(this.onClose, undefined)
        return
      }

      const callback = this.buttons[response.selection]
      if (typeof callback === 'undefined')
        throw new TypeError(
          `Callback for ${response.selection} does not exists, only ${this.buttons.length} callbacks are available`,
        )

      const buttonText = this.buttonText[response.selection]

      await this.executeCallback(callback, buttonText)
    }

    EventSignal.emit(this.onClose, undefined)
  }

  private async executeCallback(callback: NewFormCallback, buttonText: string | undefined) {
    if (__TEST__) {
      await callback(this.player, this.show)
    } else {
      try {
        if (typeof callback !== 'function') throw new Error('Callback is undefined')
        await callback(this.player, this.show)
      } catch (e) {
        console.error('FORM BUTTON ERROR', this.player.name, buttonText, callback, e)
        this.player.fail(noI18n.error`Button error: ${buttonText}, erorr: ${e}. Сообщите администрации.`)
        EventSignal.emit(this.onClose, undefined)
      }
    }
  }
}

export class ShowForm<T extends FormParams = undefined> {
  constructor(
    private create: FormCreateFn<T>,
    protected params: T,
  ) {}

  show: NewFormCallback = async (player, back) => {
    const form = new Form(player)
    if (back) form.button(ActionForm.backText, back)

    this.create(form, { player, back, params: this.params, self: () => this.show(player, back) })
    return form.show()
  }

  title(player: Player) {
    const form = new Form(player)
    const error = new Error('STOP FORM CREATION WE GOT TITLE')
    let title: undefined | Text

    try {
      this.create(
        Object.setPrototypeOf(
          {
            title(f) {
              title = f
              throw error
            },
          } satisfies Partial<typeof Form.prototype>,
          form,
        ) as Form,
        {
          player,
          back: doNothing,
          params: this.params,
          self: doNothing,
        },
      )
    } catch (e) {
      if (e !== error) throw e
    }
    return title ?? 'No title'
  }

  get command() {
    return (ctx: import('lib/command/context').CommandContext) => this.show(ctx.player)
  }
}

export function form(create: FormCreateFn) {
  return new ShowForm(create, undefined)
}

form.params = <P extends FormParams>(create: FormCreateFn<P>) => {
  return (params: P) => new ShowForm<P>(create, params) as unknown as ShowForm
}

/** Shows MessageForm to the player */
export function askNew(
  player: Player,
  messageFormBody: Text,
  yesText: Text,
  yesAction?: VoidFunction,
  noText: Text = i18n`Отмена`,
  noAction?: VoidFunction,
): Promise<boolean> {
  const hook = Promise.withResolvers<boolean>()

  askForm({ hook, messageFormBody, yesText, yesAction, noText, noAction }).show(player)

  return hook.promise
}

const askForm = form.params<{
  messageFormBody: Text
  yesText: Text
  yesAction?: VoidFunction
  noText: Text
  noAction?: VoidFunction
  hook: PromiseWithResolvers<boolean>
}>((f, { params }) => {
  f.title(i18n`Вы уверены?`)
  f.body(params.messageFormBody)
  f.button(params.yesText, () => {
    params.yesAction?.()
    params.hook.resolve(true)
  })
  f.button(params.noText, () => {
    params.noAction?.()
    params.hook.resolve(false)
  })
})
