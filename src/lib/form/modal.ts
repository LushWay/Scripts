import { Player } from '@minecraft/server'
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui'
import { defaultLang } from 'lib/assets/lang'
import { i18n } from 'lib/i18n/text'
import { util } from 'lib/util'
import { FormCallback, showForm } from './utils'

interface IModalFormArg {
  /** What this form arg is */
  type: 'dropdown' | 'slider' | 'textField' | 'toggle'
  /** If this option is a dropdown this is the Values that this dropdown can have */
  options?: (string | null)[]
}

type AppendFormField<Base, Next> = Base extends (...args: infer E) => infer R ? (...args: [...E, Next]) => R : never

export class ModalForm<Callback extends (ctx: FormCallback, ...args: any[]) => void = (ctx: FormCallback) => void> {
  static arrayDefaultNone = i18n.nocolor`Никакой`

  triedToShow

  title = ''

  /** The default minecraft form this form is based on */
  private form: ModalFormData

  /** The arguments this form has */
  private args: IModalFormArg[]

  /**
   * Creates a new form to be shown to a player
   *
   * @param {string} title The title that this form should have
   */
  constructor(title: string) {
    this.form = new ModalFormData()
    this.title = title
    if (title) this.form.title(title)
    this.args = []
    this.triedToShow = 0
  }

  /**
   * Adds a dropdown to this form
   *
   * @param label Label to show on dropdown
   * @param options The availiabe options for this dropdown
   * @param p
   * @param p.defaultValueIndex The default value index
   * @param p.defaultValue
   * @returns This
   */
  addDropdown<T extends string[], None extends false | true = false>(
    label: string,
    options: T,
    {
      defaultValueIndex = 0,
      defaultValue,
      none,
      noneText = ModalForm.arrayDefaultNone.to(defaultLang),
    }: {
      defaultValueIndex?: number
      defaultValue?: T[number]
      none?: None
      noneText?: string
    } = {},
  ): ModalForm<AppendFormField<Callback, Exclude<None extends false ? T[number] : T[number] | null, number>>> {
    if (none) options.unshift(noneText)

    if (defaultValue) {
      defaultValueIndex = options.findIndex(e => e === defaultValue)
    }

    this.args.push({ type: 'dropdown', options: options })
    this.form.dropdown(label, options, { defaultValueIndex })

    // @ts-expect-error AAAAAAAAAAAA
    return this
  }

  /**
   * Adds a dropdown to this form
   *
   * @param label Label to show on dropdown
   * @param object The availiabe options for this dropdown
   * @param options
   * @param options.defaultValueIndex The default value index
   * @param options.defaultValue The default value
   * @param options.none
   * @param options.noneText
   * @returns This
   */
  addDropdownFromObject<T extends Record<string, string>, None extends false | true = false>(
    label: string,
    object: T,
    {
      defaultValueIndex: defaultValueIndexInput,
      defaultValue,
      none,
      noneText = ModalForm.arrayDefaultNone.to(defaultLang),
      noneSelected = false,
    }: {
      defaultValueIndex?: number | string
      defaultValue?: T[keyof T]
      none?: None
      noneText?: string
      noneSelected?: boolean
    } = {},
  ): ModalForm<AppendFormField<Callback, Exclude<None extends false ? keyof T : keyof T | null, number>>> {
    let objectKeys: (string | null)[] = Object.keys(object)
    let visibleKeys = Object.values(object)

    let defaultValueIndex = 0
    if (typeof defaultValueIndexInput === 'string') {
      // Index is the keyof object
      defaultValueIndex = objectKeys.indexOf(defaultValueIndexInput)
    } else if (typeof defaultValueIndexInput === 'number') {
      // Index is the number, the actual index
      defaultValueIndex = defaultValueIndexInput
    } else if (defaultValue) {
      // No index provided, search it by ourselfes
      defaultValueIndex = visibleKeys.indexOf(defaultValue)
    }

    if (defaultValueIndex === -1) defaultValueIndex = 0

    // Prepend none to the start of the keys
    if (none) {
      visibleKeys = [noneText, ...visibleKeys]

      objectKeys = [null, ...objectKeys]
      if (typeof defaultValueIndex === 'number' && !noneSelected) defaultValueIndex++
    }

    this.args.push({ type: 'dropdown', options: objectKeys })
    this.form.dropdown(label, visibleKeys, { defaultValueIndex })

    // @ts-expect-error AAAAAAAAAAAA
    return this
  }

  /**
   * Adds a slider to this form
   *
   * @param label Label to be shown on this slider
   * @param minimumValue The smallest value this can be
   * @param maximumValue The maximum value this can be
   * @param valueStep How this slider increments
   * @param defaultValue The default value in slider
   */
  addSlider(
    label: string,
    minimumValue: number,
    maximumValue: number,
    valueStep = 1,
    defaultValue = 0,
  ): ModalForm<AppendFormField<Callback, number>> {
    this.args.push({ type: 'slider' })
    this.form.slider(label, minimumValue, maximumValue, { defaultValue, valueStep })

    // @ts-expect-error AAAAAAAAAAAA
    return this
  }

  /**
   * Adds a toggle to this form
   *
   * @param label The name of this toggle
   * @param defaultValue The default toggle value could be true or false
   */
  addToggle(label: string, defaultValue: boolean): ModalForm<AppendFormField<Callback, boolean>> {
    this.args.push({ type: 'toggle' })
    this.form.toggle(label, { defaultValue })

    // @ts-expect-error AAAAAAAAAAAA
    return this
  }

  /**
   * Adds a text field to this form
   *
   * @param label Label for this textField
   * @param placeholderText The text that shows on this field
   * @param defaultValue The default value that this field has
   */
  addTextField(
    label: string,
    placeholderText: string,
    defaultValue?: string,
  ): ModalForm<AppendFormField<Callback, string>> {
    this.args.push({ type: 'textField' })
    this.form.textField(label, placeholderText, { defaultValue })

    // @ts-expect-error AAAAAAAAAAAA
    return this
  }

  /**
   * Shows this form to a player
   *
   * @param callback Sends a callback when this form is submited
   * @param player Player to show to
   */
  async show(player: Player, callback: Callback): Promise<void> {
    const response = await showForm(this.form, player)
    if (response === false || !(response instanceof ModalFormResponse)) return

    util.catch(() => {
      if (!response.formValues) return
      const args = response.formValues.map((formValue, i) => {
        const arg = this.args[i]
        if (!arg) return formValue

        if (arg.type === 'dropdown' && typeof formValue === 'number') return arg.options?.[formValue]
        else return formValue
      })
      callback(new FormCallback(this, player, () => this.show(player, callback)), ...args)
    })
  }
}
