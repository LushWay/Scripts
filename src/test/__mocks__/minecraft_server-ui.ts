import * as minecraftserver from '@minecraft/server'
import { Language } from 'lib/assets/lang'
import { rawTextToString } from 'lib/i18n/lang'
import { isKeyof } from 'lib/util'
import { inaccurateSearch } from 'lib/utils/search'
import { TestPlayer } from 'test/utils'

export enum FormCancelationReason {
  UserBusy = 'UserBusy',
  UserClosed = 'UserClosed',
}

export enum FormRejectReason {
  MalformedResponse = 'MalformedResponse',
  PlayerQuit = 'PlayerQuit',
  ServerShutdown = 'ServerShutdown',
}

export class ActionFormData {
  form: TFD['action']['form'] = {
    body: '',
    title: '',
    buttons: [],
  }
  title(titleText: minecraftserver.RawMessage | string): ActionFormData {
    this.form.title = titleText
    return this
  }
  body(bodyText: minecraftserver.RawMessage | string): ActionFormData {
    this.form.body = bodyText
    return this
  }
  button(text: minecraftserver.RawMessage | string, iconPath?: string): ActionFormData {
    this.form.buttons.push({ text, icon: iconPath })
    return this
  }
  async show(player: minecraftserver.Player): Promise<ActionFormResponse> {
    return processCallback(player, 'action', this.form)
  }
}

export class FormResponse {
  constructor(
    readonly canceled: boolean = false,
    readonly cancelationReason?: FormCancelationReason,
  ) {}
}

export class ActionFormResponse extends FormResponse {
  readonly selection?: number
}

export class MessageFormData {
  form: TFD['message']['form'] = {
    body: '',
    title: '',
    button1: { text: '' },
    button2: { text: '' },
  }
  title(titleText: minecraftserver.RawMessage | string): MessageFormData {
    this.form.title = titleText
    return this
  }
  body(bodyText: minecraftserver.RawMessage | string): MessageFormData {
    this.form.body = bodyText
    return this
  }
  button1(text: minecraftserver.RawMessage | string): MessageFormData {
    this.form.button1 = { text }
    return this
  }
  button2(text: minecraftserver.RawMessage | string): MessageFormData {
    this.form.button2 = { text }
    return this
  }
  async show(player: minecraftserver.Player): Promise<MessageFormResponse> {
    return processCallback(player, 'message', this.form)
  }
}

export class MessageFormResponse extends FormResponse {
  readonly selection?: number
}

export class ModalFormData {
  form: TFD['modal']['form'] = {
    buttons: [],
    title: '',
    body: '',
  }
  title(titleText: minecraftserver.RawMessage | string): ModalFormData {
    this.form.title = titleText
    return this
  }
  dropdown(
    label: minecraftserver.RawMessage | string,
    options: (minecraftserver.RawMessage | string)[],
    defaultValueIndex?: number,
  ): ModalFormData {
    this.form.buttons.push({ type: 'dropdown', options, defaultValueIndex, label })
    return this
  }

  slider(
    label: minecraftserver.RawMessage | string,
    minimumValue: number,
    maximumValue: number,
    valueStep: number,
    defaultValue?: number,
  ): ModalFormData {
    this.form.buttons.push({ type: 'slider', label, minimumValue, maximumValue, valueStep, defaultValue })
    return this
  }
  submitButton(submitButtonText: minecraftserver.RawMessage | string): ModalFormData {
    this.form.submitText = submitButtonText
    return this
  }
  textField(
    label: minecraftserver.RawMessage | string,
    placeholderText: minecraftserver.RawMessage | string,
    defaultValue?: minecraftserver.RawMessage | string,
  ): ModalFormData {
    this.form.buttons.push({ type: 'textField', label, placeholderText, defaultValue })
    return this
  }

  toggle(label: minecraftserver.RawMessage | string, defaultValue?: boolean): ModalFormData {
    this.form.buttons.push({ type: 'toggle', label, defaultValue })
    return this
  }
  async show(player: minecraftserver.Player): Promise<ModalFormResponse> {
    return processCallback(player, 'modal', this.form)
  }
}

export class ModalFormResponse extends FormResponse {
  readonly formValues?: (boolean | number | string)[]
}

export class FormRejectError extends Error {
  reason: FormRejectReason = FormRejectReason.PlayerQuit
}

type MT = string | minecraftserver.RawMessage

export class NotFoundButtonError extends Error {}

abstract class FormSelector<T extends keyof TFD> {
  constructor(
    protected kind: T,
    protected form: TFD[T]['form'],
  ) {}

  get body() {
    return TestFormUtils.toString(this.form.body)
  }

  get title() {
    return TestFormUtils.toString(this.form.title)
  }

  dump() {
    return {
      title: this.title,
      body: this.body,
      buttons: this.clickOnButtonWhichText.dump(),
    }
  }

  abstract clickOnButtonWhichText: ButtonsSelector<T>
}

class ModalFormSelector extends FormSelector<'modal'> {
  clickOnButtonWhichText: ModalButtonsSelector = new ModalButtonsSelector(this, this.form, this.kind)
}

class ActionMessageFormSelector<T extends keyof TFD> extends FormSelector<T> {
  clickOnButtonWhichText: ActionAndMessageButtonsSelector<T> = new ActionAndMessageButtonsSelector(
    this,
    this.form,
    this.kind,
  )
}

abstract class ButtonsSelector<T extends keyof TFD> {
  constructor(
    protected selector: FormSelector<T>,
    protected form: TFD[T]['form'],
    protected kind: T,
  ) {}
  protected isAction(form: TFD[T]['form']): form is TFD['action']['form'] {
    return 'buttons' in form
  }

  protected isMessage(form: TFD[T]['form']): form is TFD['message']['form'] {
    return 'button1' in form
  }

  protected isModal(form: TFD[T]['form']): form is TFD['modal']['form'] {
    return 'submitText' in form
  }

  abstract dump(): unknown
}

class ModalButtonsSelector extends ButtonsSelector<'modal'> {
  dump(): string {
    return 'not implemented'
  }
}

class ActionAndMessageButtonsSelector<T extends keyof TFD> extends ButtonsSelector<T> {
  protected buttons() {
    if (this.isAction(this.form)) {
      return this.form.buttons
    } else if (this.isMessage(this.form)) {
      return [this.form.button1, this.form.button2]
    } else throw new Error(`Unsupported form kind: ${this.kind}`)
  }

  protected searchRaw(buttons: { text: MT }[], searchFn: (text: MT) => boolean) {
    const index = buttons.findIndex(e => searchFn(e.text))
    if (index === -1) throw new NotFoundButtonError(`Unable to find button`)
    return index
  }

  protected searchString(buttons: { text: MT }[], uncolored = false, searchFn: (button: string) => boolean) {
    return this.searchRaw(buttons, text => searchFn(TestFormUtils.toString(text, uncolored)))
  }

  protected searchPattern(buttons: { text: MT }[], pattern: RegExp, uncolored = false) {
    try {
      return this.searchString(buttons, uncolored, text => pattern.test(text))
    } catch (error) {
      if (error instanceof NotFoundButtonError) {
        throw new NotFoundButtonError(`Unable to find button which matches the pattern ${String(pattern)}`)
      } else throw error
    }
  }

  private searchEquals(buttons: { text: MT }[], pattern: string, uncolored = false) {
    try {
      return this.searchString(buttons, uncolored, text => pattern === text)
    } catch (error) {
      if (error instanceof NotFoundButtonError) {
        const buttonTexts = buttons.map(e => TestFormUtils.toString(e.text, uncolored))
        const closestButtons = inaccurateSearch(pattern, buttonTexts)
        const closest = closestButtons
          .slice(0, 5)
          .map(e => `'${e[0]}' ${~~(e[1] * 100)}%`)
          .join(', ')
        throw new NotFoundButtonError(`Unable to find button with text '${pattern}', closest is ${closest}`)
      } else throw error
    }
  }

  matches(pattern: RegExp): TFD[T]['returns'] {
    return this.searchPattern(this.buttons(), pattern, false)
  }
  matchesUncolored(pattern: RegExp): TFD[T]['returns'] {
    return this.searchPattern(this.buttons(), pattern, true)
  }

  equals(buttonText: string): TFD[T]['returns'] {
    return this.searchEquals(this.buttons(), buttonText, false)
  }

  equalsUncolored(buttonText: string): TFD[T]['returns'] {
    return this.searchEquals(this.buttons(), buttonText, true)
  }

  dump() {
    return this.buttons().map(e => TestFormUtils.toString(e.text))
  }

  dumpUncolored() {
    return this.buttons().map(e => TestFormUtils.toString(e.text, true))
  }

  dumpRaw() {
    return this.buttons().map(e => ('icon' in e ? e : e.text))
  }
}

class TestFormUtils {
  static toString(buttonText: MT, uncolored = false) {
    if (typeof buttonText !== 'string') buttonText = rawTextToString(buttonText, Language.en_US)
    return uncolored ? buttonText.replace(/§./g, '') : buttonText
  }
}

type TestFormCallbackSelect<T extends keyof TFD> = T extends 'modal' ? ModalFormSelector : ActionMessageFormSelector<T>
export type TestFormCallback<T extends keyof TFD> = (
  select: TestFormCallbackSelect<T>,
  form: TFD[T]['form'],
  utils: typeof TestFormUtils,
) => MaybePromise<TFD[T]['returns'] | FormCancelationReason | FormRejectReason>

interface BaseForm {
  title: MT
  body: MT
}

interface TestMessageFormData {
  form: BaseForm & {
    button1: {
      text: MT
    }
    button2: {
      text: MT
    }
  }
  returns: 0 | 1
}

interface TestActionFormData {
  form: BaseForm & {
    buttons: {
      text: MT
      icon?: string
    }[]
  }
  returns: number
}

interface TestModalFormData {
  form: BaseForm & {
    buttons: ModalFormButton[]
    submitText?: MT
  }
  returns: (string | number | boolean)[]
}

export interface TFD {
  message: TestMessageFormData
  action: TestActionFormData
  modal: TestModalFormData
}

type ModalFormButton =
  | {
      type: 'slider'
      label: minecraftserver.RawMessage | string
      minimumValue: number
      maximumValue: number
      valueStep: number
      defaultValue?: number
    }
  | {
      type: 'dropdown'
      label: minecraftserver.RawMessage | string
      options: (minecraftserver.RawMessage | string)[]
      defaultValueIndex?: number
    }
  | { type: 'toggle'; label: minecraftserver.RawMessage | string; defaultValue?: boolean }
  | {
      type: 'textField'
      label: minecraftserver.RawMessage | string
      placeholderText: minecraftserver.RawMessage | string
      defaultValue?: minecraftserver.RawMessage | string
    }

const responses = {
  message: MessageFormResponse,
  modal: ModalFormResponse,
  action: ActionFormResponse,
} satisfies Record<keyof TFD, typeof FormResponse>

async function processCallback<T extends keyof TFD>(
  player: minecraftserver.Player,
  kind: T,
  form: TFD[T]['form'],
): Promise<InstanceType<(typeof responses)[T]>> {
  const callback = (player as TestPlayer).onForm?.[kind]

  if (!callback) throw new FormRejectError(FormRejectReason.MalformedResponse)

  type TT = InstanceType<(typeof responses)[T]>
  const response = responses[kind]
  const result = await callback(
    (kind === 'modal'
      ? new ModalFormSelector(kind, form as TestModalFormData['form'])
      : new ActionMessageFormSelector(kind, form)) as TestFormCallbackSelect<T>,
    form,
    TestFormUtils,
  )

  if (typeof result === 'string' && isKeyof(result, FormCancelationReason)) return new response(true, result) as TT

  if (kind === 'action') {
    const response = new ActionFormResponse()
    // @ts-expect-error
    response.selection = result

    return response as TT
  } else if (kind === 'message') {
    const response = new MessageFormResponse()
    // @ts-expect-error
    response.selection = result

    return response as TT
  } else {
    const response = new ModalFormResponse()
    // @ts-expect-error
    response.formValues = result

    return response as TT
  }
}
