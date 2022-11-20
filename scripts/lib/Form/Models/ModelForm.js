import { Player } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { FormCallback } from "../utils.js";
import { XFormCanceled } from "../utils.js";

/**
 * @template [Callback = (ctx: FormCallback) => void]
 */
export class ModalForm {
	/**
	 *  the title that this form should have
	 * @type {string}
	 */
	title;
	/**
	 * The default minecraft form this form is based on
	 * @type {ModalFormData}
	 * @private
	 */
	form;
	/**
	 * The arguments this form has
	 * @type {IModalFormArg[]}
	 * @private
	 */
	args;
	/**
	 * The amount of times it takes to show this form in ms
	 * if this value goes above 200 it will time out
	 * @type {number}
	 */
	triedToShow;
	/**
	 * Creates a new form to be shown to a player
	 * @param {string} title the title that this form should have
	 */
	constructor(title) {
		this.title = title;
		this.form = new ModalFormData();
		if (title) this.form.title(title);
		this.args = [];
		this.triedToShow = 0;
	}
	/**
	 * Adds a dropdown to this form
	 * @template [T = ReadonlyArray<string>]
	 * @param {string} label  label to show on dropdown
	 * @param {T} options  the availiabe options for this dropdown
	 * @param {number} defaultValueIndex  the default value index
	 * @returns {ModalForm<AppendFormField<Callback, T[number]>>} this
	 */
	addDropdown(label, options, defaultValueIndex) {
		// @ts-ignore
		this.args.push({ type: "dropdown", options: options });
		// @ts-ignore
		this.form.dropdown(label, options, defaultValueIndex);
		// @ts-ignore
		return this;
	}
	/**
	 * @type {ModalFormAddSlider}
	 */
	addSlider(label, minimumValue, maximumValue, valueStep, defaultValue) {
		this.args.push({ type: "slider" });
		this.form.slider(
			label,
			minimumValue,
			maximumValue,
			valueStep,
			defaultValue
		);
		// @ts-ignore
		return this;
	}
	/**
	 * Adds a toggle to this form
	 * @param {string} label  the name of this toggle
	 * @param {boolean} defaultValue  the default toggle value could be true or false
	 * @returns {ModalForm<AppendFormField<Callback, boolean>>}
	 */
	addToggle(label, defaultValue) {
		this.args.push({ type: "toggle" });
		this.form.toggle(label, defaultValue);
		// @ts-ignore
		return this;
	}
	/**
	 * Adds a text field to this form
	 * @param {string} label  label for this textField
	 * @param {string} placeholderText  the text that shows on this field
	 * @param {string} defaultValue  the default value that this field has
	 * @returns {ModalForm<AppendFormField<Callback, string>>}
	 */
	addTextField(label, placeholderText, defaultValue) {
		this.args.push({ type: "textField" });
		this.form.textField(label, placeholderText, defaultValue);
		// @ts-ignore
		return this;
	}

	/**
	 * Shows this form to a player
	 * @param {Player} player  player to show to
	 * @param {Callback extends Function ? Callback : never} callback  sends a callback when this form is submited
	 * @returns {Promise<void>}
	 */
	async show(player, callback) {
		const response = await this.form.show(player);
		if (XFormCanceled(response, player, this)) return;
		callback(
			new FormCallback(this, player, callback),
			...response.formValues.map((v, i) =>
				this.args[i].type == "dropdown" ? this.args[i].options[v] : v
			)
		);
	}
}
