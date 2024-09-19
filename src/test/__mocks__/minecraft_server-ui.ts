import * as minecraftserver from '@minecraft/server'
import { isKeyof } from 'lib/util'
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
  data: FormData['action']['arg'] = {
    body: '',
    title: '',
    buttons: [],
  }
  title(titleText: minecraftserver.RawMessage | string): ActionFormData {
    this.data.title = titleText
    return this
  }
  body(bodyText: minecraftserver.RawMessage | string): ActionFormData {
    this.data.body = bodyText
    return this
  }
  button(text: minecraftserver.RawMessage | string, iconPath?: string): ActionFormData {
    this.data.buttons.push({ text, icon: iconPath })
    return this
  }
  async show(player: minecraftserver.Player): Promise<ActionFormResponse> {
    return processCallback(player, 'action', this.data)
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
  data: FormData['message']['arg'] = {
    body: '',
    title: '',
    button1: { text: '' },
    button2: { text: '' },
  }
  title(titleText: minecraftserver.RawMessage | string): MessageFormData {
    this.data.title = titleText
    return this
  }
  body(bodyText: minecraftserver.RawMessage | string): MessageFormData {
    this.data.body = bodyText
    return this
  }
  button1(text: minecraftserver.RawMessage | string): MessageFormData {
    this.data.button1 = { text }
    return this
  }
  button2(text: minecraftserver.RawMessage | string): MessageFormData {
    this.data.button2 = { text }
    return this
  }
  async show(player: minecraftserver.Player): Promise<MessageFormResponse> {
    return processCallback(player, 'message', this.data)
  }
}

export class MessageFormResponse extends FormResponse {
  readonly selection?: number
}

export class ModalFormData {
  data: FormData['modal']['arg'] = {
    buttons: [],
    title: '',
    body: '',
  }
  title(titleText: minecraftserver.RawMessage | string): ModalFormData {
    this.data.title = titleText
    return this
  }
  dropdown(
    label: minecraftserver.RawMessage | string,
    options: (minecraftserver.RawMessage | string)[],
    defaultValueIndex?: number,
  ): ModalFormData {
    this.data.buttons.push({ type: 'dropdown', options, defaultValueIndex, label })
    return this
  }

  slider(
    label: minecraftserver.RawMessage | string,
    minimumValue: number,
    maximumValue: number,
    valueStep: number,
    defaultValue?: number,
  ): ModalFormData {
    this.data.buttons.push({ type: 'slider', label, minimumValue, maximumValue, valueStep, defaultValue })
    return this
  }
  submitButton(submitButtonText: minecraftserver.RawMessage | string): ModalFormData {
    this.data.submitText = submitButtonText
    return this
  }
  textField(
    label: minecraftserver.RawMessage | string,
    placeholderText: minecraftserver.RawMessage | string,
    defaultValue?: minecraftserver.RawMessage | string,
  ): ModalFormData {
    this.data.buttons.push({ type: 'textField', label, placeholderText, defaultValue })
    return this
  }

  toggle(label: minecraftserver.RawMessage | string, defaultValue?: boolean): ModalFormData {
    this.data.buttons.push({ type: 'toggle', label, defaultValue })
    return this
  }
  async show(player: minecraftserver.Player): Promise<ModalFormResponse> {
    return processCallback(player, 'modal', this.data)
  }
}

export class ModalFormResponse extends FormResponse {
  readonly formValues?: (boolean | number | string)[]
}

export class FormRejectError extends Error {
  reason: FormRejectReason = FormRejectReason.PlayerQuit
}

type MT = string | minecraftserver.RawMessage

export type FormCl<T extends keyof FormData> = (
  arg: FormData[T]['arg'],
) => FormData[T]['returns'] | FormCancelationReason | FormRejectReason

interface BaseFormArg {
  title: MT
  body: MT
}

export interface FormData {
  message: {
    arg: BaseFormArg & {
      button1: { text: MT }
      button2: { text: MT }
    }
    returns: 0 | 1
  }
  action: {
    arg: BaseFormArg & {
      buttons: { text: MT; icon?: string }[]
    }
    returns: number
  }
  modal: {
    arg: BaseFormArg & { buttons: ModalFormButton[]; submitText?: MT }
    returns: (string | number | boolean)[]
  }
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
} satisfies Record<keyof FormData, typeof FormResponse>

function processCallback<T extends keyof FormData>(
  player: minecraftserver.Player,
  kind: T,
  arg: FormData[T]['arg'],
): InstanceType<(typeof responses)[T]> {
  const callback = (player as TestPlayer).onForm?.[kind]

  if (!callback) throw new FormRejectError(FormRejectReason.MalformedResponse)

  type TT = InstanceType<(typeof responses)[T]>
  const response = responses[kind]
  const result = callback(arg)
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
