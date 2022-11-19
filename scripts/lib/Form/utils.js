import { Player } from "@minecraft/server";
import {
	ActionFormResponse,
	MessageFormResponse,
	ModalFormResponse,
} from "@minecraft/server-ui";
import { ActionForm } from "./Models/ActionForm.js";
import { MessageForm } from "./Models/MessageForm.js";
import { ModalForm } from "./Models/ModelForm.js";

/** */
export class FormCallback {
	/**
	 * form that was used in this call
	 * @type {ActionForm | MessageForm | ModalForm<any>}
	 * @private
	 */
	form;
	/**
	 * player that this form used
	 * @type {Player}
	 * @private
	 */
	player;
	/**
	 * the function that was called
	 * @type {Function}
	 * @private
	 */
	callback;
	/**
	 * Creates a new form callback instance that can be used by
	 * buttons, and args to run various functions
	 * @param {ActionForm | MessageForm | ModalForm<any>} form form that is used in this call
	 * @param {Player} player
	 * @param {Function} callback
	 */
	constructor(form, player, callback) {
		this.form = form;
		this.player = player;
		this.callback = callback;
	}
	/**
	 * Reshows the form and shows the user a error message
	 * @param {string} message  error message to show
	 * @returns {void}
	 */
	error(message) {
		new MessageForm("Error", message)
			.setButton1("Return to form", () => {
				this.form.show(this.player, this.callback);
			})
			.setButton2("Cancel", null)
			.show(this.player);
	}
}
/**
 *
 * @param {ActionFormResponse | ModalFormResponse | MessageFormResponse} response
 * @param {Player} player
 * @returns
 */
export function XFormCanceled(response, player) {
	if (response.canceled) {
		if (response.cancelationReason == "userBusy") {
			// check time and reshow form
			if (this.triedToShow > 200)
				return player.tell(
					`§cНе удалось открыть форму. Закрой чат и попробуй снова`
				);
			this.triedToShow++;
			this.show(player);
		}
		return true;
	}
}
