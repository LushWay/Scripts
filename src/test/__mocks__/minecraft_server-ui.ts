import * as minecraftserver from '@minecraft/server'

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
  body(bodyText: minecraftserver.RawMessage | string): ActionFormData {
    return this
  }
  button(text: minecraftserver.RawMessage | string, iconPath?: string): ActionFormData {
    return this
  }
  async show(player: minecraftserver.Player): Promise<ActionFormResponse> {
    return new ActionFormResponse()
  }
  title(titleText: minecraftserver.RawMessage | string): ActionFormData {
    return this
  }
}

export class FormResponse {
  constructor() {}
  readonly cancelationReason?: FormCancelationReason
  readonly canceled: boolean = false
}

export class ActionFormResponse extends FormResponse {
  readonly selection?: number
}

export class MessageFormData {
  /**
   * @remarks
   *   Method that sets the body text for the modal form.
   */
  body(bodyText: minecraftserver.RawMessage | string): MessageFormData {
    return this
  }
  button1(text: minecraftserver.RawMessage | string): MessageFormData {
    return this
  }
  button2(text: minecraftserver.RawMessage | string): MessageFormData {
    return this
  }
  async show(player: minecraftserver.Player): Promise<MessageFormResponse> {
    return new MessageFormResponse()
  }
  title(titleText: minecraftserver.RawMessage | string): MessageFormData {
    return this
  }
}

export class MessageFormResponse extends FormResponse {
  readonly selection?: number
}

export class ModalFormData {
  dropdown(
    label: minecraftserver.RawMessage | string,
    options: (minecraftserver.RawMessage | string)[],
    defaultValueIndex?: number,
  ): ModalFormData {
    return this
  }
  async show(player: minecraftserver.Player): Promise<ModalFormResponse> {
    return new ModalFormResponse()
  }
  slider(
    label: minecraftserver.RawMessage | string,
    minimumValue: number,
    maximumValue: number,
    valueStep: number,
    defaultValue?: number,
  ): ModalFormData {
    return this
  }
  submitButton(submitButtonText: minecraftserver.RawMessage | string): ModalFormData {
    return this
  }
  textField(
    label: minecraftserver.RawMessage | string,
    placeholderText: minecraftserver.RawMessage | string,
    defaultValue?: minecraftserver.RawMessage | string,
  ): ModalFormData {
    return this
  }
  title(titleText: minecraftserver.RawMessage | string): ModalFormData {
    return this
  }
  toggle(label: minecraftserver.RawMessage | string, defaultValue?: boolean): ModalFormData {
    return this
  }
}

export class ModalFormResponse extends FormResponse {
  readonly formValues?: (boolean | number | string)[]
}

export class FormRejectError extends Error {
  reason: FormRejectReason = FormRejectReason.PlayerQuit
}
