import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { XFormCanceled } from "../utils.js";
/** */
export class ActionForm {
	/**
	 * The title that this form should have
	 * @type {string}
	 */
	title;
	/**
	 * extra text that should be displayed in the form
	 * @type {string}
	 */
	body;
	/**
	 * The buttons this form has
	 * @type {IActionFormButton[]}
	 * @private
	 */
	buttons;
	/**
	 * The default minecraft form this form is based on
	 * @type {ActionFormData}
	 * @private
	 */
	form;
	/**
	 * The amount of times it takes to show this form in ms
	 * if this value goes above 200 it will time out
	 * @type {number}
	 */
	triedToShow;
	/**
	 * Creates a new form to be shown to a player
	 * @param {string} [title] the title that this form should have
	 * @param {string} [body] extra text that should be displayed in the form
	 */
	constructor(title, body) {
		this.title = title;
		this.body = body;
		this.form = new ActionFormData();
		if (title) this.form.title(title);
		if (body) this.form.body(body);
		this.buttons = [];
		this.triedToShow = 0;
	}
	/**
	 * Adds a button to this form
	 * @param {string} text  text to show on this button
	 * @param {string} iconPath  the path this button shows
	 * @param {ButtonCallback} callback  what happens when this button is clicked
	 * @example ```
	 * addButton("settings", "textures/items/sum")
	 * ```
	 * @returns {ActionForm}
	 */
	addButton(text, iconPath = null, callback) {
		this.buttons.push({
			text: text,
			iconPath: iconPath,
			callback: callback,
		});
		this.form.button(text, iconPath);
		return this;
	}
	/**
	 * Shows this form to the player
	 * @param {Player} player  player to show to
	 * @returns {Promise<void>}
	 */
	async show(player) {
		const response = await this.form.show(player);
		if (XFormCanceled(response, player, this)) return;
		this.buttons[response.selection].callback?.();
	}
}
