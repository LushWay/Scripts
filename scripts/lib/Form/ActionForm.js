import { Player } from "@minecraft/server";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { handle } from "../../xapi.js";
import { XShowForm } from "./utils.js";
/** */
export class ActionForm {
	/**
	 * The buttons this form has
	 * @type {IActionFormButton[]}
	 * @private
	 */
	buttons = [];
	/**
	 * The default minecraft form this form is based on
	 * @type {ActionFormData}
	 * @private
	 */
	form;
	title = "";
	/**
	 * Creates a new form to be shown to a player
	 * @param {string} title the title that this form should have
	 * @param {string} [body] extra text that should be displayed in the form
	 */
	constructor(title, body = "") {
		this.form = new ActionFormData();
		this.form.title(title);
		this.title = title;
		this.form.body(body);
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
		const response = await XShowForm(this.form, player);
		if (response === false || !(response instanceof ActionFormResponse)) return;
		const callback = this.buttons[response.selection]?.callback;
		if (typeof callback === "function")
			handle(callback, null, ["ActionFormCallback"]);
	}
}


