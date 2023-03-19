import { GameMode, Player, system } from "@minecraft/server";
import { ActionFormData, ActionFormResponse, FormCancelationReason, MessageFormData, MessageFormResponse, ModalFormData, ModalFormResponse, } from "@minecraft/server-ui";
import { ActionForm } from "./ActionForm.js";
import { MessageForm } from "./MessageForm.js";
import { ModalForm } from "./ModelForm.js";
/** */
export class FormCallback {
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
 * It shows a form to a player and if the player is busy, it will try to show the form again until it
 * succeeds or the maximum number of attempts is reached.
 * @param {ActionFormData | ModalFormData | MessageFormData} form - The form you want to show.
 * @param {Player} player - The player who will receive the form.
 * @returns  The response from the form.
 */
export async function XShowForm(form, player) {
    let hold = 100;
    for (let i = 0; i <= hold; i++) {
        /** @type {ActionFormResponse | ModalFormResponse | MessageFormResponse} */
        const response = await form.show(player);
        if (response.canceled) {
            if (response.cancelationReason === FormCancelationReason.userClosed)
                return false;
            // check time and reshow form
            if (response.cancelationReason === FormCancelationReason.userBusy && i === hold) {
                player.tell(`§cНе удалось открыть форму. Закрой чат и попробуй снова`);
                return false;
            }
        }
        else
            return response;
    }
}
