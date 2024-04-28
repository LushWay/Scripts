import { Player } from '@minecraft/server'
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui'
import { FormCallback, showForm } from './utils.js'
import { util } from 'lib/util.js'

/** @template {Function} [Callback=(ctx: FormCallback) => void] Default is `(ctx: FormCallback) => void` */
export class ModalForm {
  static arrayDefaultNone = 'Никакой'

  title = ''

  /**
   * The default minecraft form this form is based on
   *
   * @private
   * @type {ModalFormData}
   */
  form

  /**
   * The arguments this form has
   *
   * @private
   * @type {IModalFormArg[]}
   */
  args

  /**
   * Creates a new form to be shown to a player
   *
   * @param {string} title The title that this form should have
   */
  constructor(title) {
    this.form = new ModalFormData()
    this.title = title
    if (title) this.form.title(title)
    this.args = []
    this.triedToShow = 0
  }

  /**
   * Adds a dropdown to this form
   *
   * @template {string[]} T
   * @param {string} label Label to show on dropdown
   * @param {T} options The availiabe options for this dropdown
   * @param {object} [p]
   * @param {number} [p.defaultValueIndex] The default value index
   * @param {T[number]} [p.defaultValue]
   * @returns {ModalForm<AppendFormField<Callback, T[number]>>} This
   */
  addDropdown(label, options, { defaultValueIndex = 0, defaultValue } = {}) {
    if (defaultValue) {
      defaultValueIndex = options.findIndex(e => e === defaultValue)
    }

    this.args.push({ type: 'dropdown', options: options })
    this.form.dropdown(label, options, defaultValueIndex)
    // @ts-expect-error This type
    return this
  }

  /**
   * Adds a dropdown to this form
   *
   * @template {Record<string, string>} [T=Record<string, string>] Default is `Record<string, string>`
   * @template {false | true} [None=false] Default is `false`
   * @param {string} label Label to show on dropdown
   * @param {T} object The availiabe options for this dropdown
   * @param {object} [options]
   * @param {number} [options.defaultValueIndex] The default value index
   * @param {T[keyof T]} [options.defaultValue] The default value
   * @param {None} [options.none]
   * @param {string} [options.noneText]
   * @returns {ModalForm<AppendFormField<Callback, Exclude<None extends false ? keyof T : keyof T | null, number>>>}
   *   This
   */
  addDropdownFromObject(
    label,
    object,
    { defaultValueIndex, defaultValue, none, noneText = ModalForm.arrayDefaultNone } = {},
  ) {
    /** @type {(string | null)[]} */
    let objectKeys = Object.keys(object)
    let visibleKeys = Object.values(object)

    if (defaultValue) {
      defaultValueIndex = visibleKeys.findIndex(e => e === defaultValue)
    }

    // Prepend none to the start of the keys
    if (none) {
      visibleKeys = [noneText, ...visibleKeys]
      objectKeys = [null, ...objectKeys]
      if (typeof defaultValueIndex === 'number') defaultValueIndex++
    }

    this.args.push({ type: 'dropdown', options: objectKeys })
    this.form.dropdown(label, visibleKeys, defaultValueIndex)
    // @ts-expect-error This type
    return this
  }

  /**
   * Adds a slider to this form
   *
   * @param {string} label Label to be shown on this slider
   * @param {number} minimumValue The smallest value this can be
   * @param {number} maximumValue The maximum value this can be
   * @param {number} valueStep How this slider increments
   * @param {number} defaultValue The default value in slider
   * @returns {ModalForm<AppendFormField<Callback, number>>}
   */
  addSlider(label, minimumValue, maximumValue, valueStep = 1, defaultValue = 0) {
    this.args.push({ type: 'slider' })
    this.form.slider(label, minimumValue, maximumValue, valueStep, defaultValue)
    // @ts-expect-error This type
    return this
  }

  /**
   * Adds a toggle to this form
   *
   * @param {string} label The name of this toggle
   * @param {boolean} defaultValue The default toggle value could be true or false
   * @returns {ModalForm<AppendFormField<Callback, boolean>>}
   */
  addToggle(label, defaultValue) {
    this.args.push({ type: 'toggle' })
    this.form.toggle(label, defaultValue)
    // @ts-expect-error This type
    return this
  }

  /**
   * Adds a text field to this form
   *
   * @param {string} label Label for this textField
   * @param {string} placeholderText The text that shows on this field
   * @param {string} [defaultValue] The default value that this field has
   * @returns {ModalForm<AppendFormField<Callback, string>>}
   */
  addTextField(label, placeholderText, defaultValue) {
    this.args.push({ type: 'textField' })
    this.form.textField(label, placeholderText, defaultValue)
    // @ts-expect-error This type
    return this
  }

  /**
   * Shows this form to a player
   *
   * @param {Player} player Player to show to
   * @param {Callback} callback Sends a callback when this form is submited
   * @returns {Promise<void>}
   */
  async show(player, callback) {
    const response = await showForm(this.form, player)
    if (response === false || !(response instanceof ModalFormResponse)) return

    util.catch(() => {
      if (!response.formValues) return
      const args = response.formValues.map((formValue, i) => {
        const arg = this.args[i]

        if (arg.type === 'dropdown' && typeof formValue === 'number') {
          return arg.options?.[formValue]
        } else return formValue
      })
      callback(
        new FormCallback(
          this,
          player,
          // @ts-expect-error idk
          callback,
        ),
        ...args,
      )
    })
  }
}
