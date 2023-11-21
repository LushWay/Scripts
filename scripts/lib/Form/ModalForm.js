import { Player } from '@minecraft/server'
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui'
import { util } from 'smapi.js'
import { FormCallback, showForm } from './utils.js'

/**
 * @template {Function} [Callback = (ctx: FormCallback) => void]
 */
export class ModalForm {
  static arrayDefaultNone = 'Никакой'

  title = ''
  /**
   * The default minecraft form this form is based on
   * @type {ModalFormData}
   * @private
   */
  form
  /**
   * The arguments this form has
   * @type {IModalFormArg[]}
   * @private
   */
  args
  /**
   * Creates a new form to be shown to a player
   * @param {string} title the title that this form should have
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
   * @template {string[]} T
   * @param {string} label  label to show on dropdown
   * @param {T} options  the availiabe options for this dropdown
   * @param {object} [p]
   * @param {number} [p.defaultValueIndex]  the default value index
   * @param {T[number]} [p.defaultValue]
   * @returns {ModalForm<AppendFormField<Callback, T[number]>>} this
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
   * @template {Record<string, string>} [T=Record<string, string>]
   * @template {false | true} [None=false]
   * @param {string} label  label to show on dropdown
   * @param {T} object  the availiabe options for this dropdown
   * @param {object} [options]
   * @param {number} [options.defaultValueIndex]  the default value index
   * @param {T[keyof T]} [options.defaultValue]  the default value
   * @param {None} [options.none]
   * @param {string} [options.noneText]
   * @returns {ModalForm<AppendFormField<Callback, Exclude<None extends false ? keyof T : keyof T | null, number>>>} this
   */
  addDropdownFromObject(
    label,
    object,
    {
      defaultValueIndex = 0,
      defaultValue,
      none,
      noneText = ModalForm.arrayDefaultNone,
    } = {}
  ) {
    if (defaultValue) {
      defaultValueIndex = Object.values(object).findIndex(
        e => e === defaultValue
      )
    }
    /** @type {(string | null)[]} */
    let objectKeys = Object.keys(object)
    let visibleKeys = Object.values(object)

    if (none) {
      visibleKeys = [noneText, ...visibleKeys]
      objectKeys = [null, ...objectKeys]
    }

    this.args.push({ type: 'dropdown', options: objectKeys })
    this.form.dropdown(label, visibleKeys, defaultValueIndex)
    // @ts-expect-error This type
    return this
  }
  /**
   * Adds a slider to this form
   * @param {string} label  label to be shown on this slider
   * @param {number} minimumValue  the smallest value this can be
   * @param {number} maximumValue  the maximum value this can be
   * @param {number} valueStep  how this slider increments
   * @param {number} defaultValue  the default value in slider
   * @returns {ModalForm<AppendFormField<Callback, number>>}
   */
  addSlider(
    label,
    minimumValue,
    maximumValue,
    valueStep = 1,
    defaultValue = 0
  ) {
    this.args.push({ type: 'slider' })
    this.form.slider(label, minimumValue, maximumValue, valueStep, defaultValue)
    // @ts-expect-error This type
    return this
  }
  /**
   * Adds a toggle to this form
   * @param {string} label  the name of this toggle
   * @param {boolean} defaultValue  the default toggle value could be true or false
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
   * @param {string} label  label for this textField
   * @param {string} placeholderText  the text that shows on this field
   * @param {string} [defaultValue]  the default value that this field has
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
   * @param {Player} player  player to show to
   * @param {Callback} callback  sends a callback when this form is submited
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
          callback
        ),
        ...args
      )
    })
  }
}
