/**
 * It shows a form to a player and if the player is busy, it will try to show the form again until it
 * succeeds or the maximum number of attempts is reached.
 * @param {ActionFormData | ModalFormData | MessageFormData} form - The form you want to show.
 * @param {Player} player - The player who will receive the form.
 * @returns  The response from the form.
 */
export function XShowForm(form: ActionFormData | ModalFormData | MessageFormData, player: Player): Promise<false | ActionFormResponse | MessageFormResponse | ModalFormResponse>;
/** */
export class FormCallback {
    /**
     * Creates a new form callback instance that can be used by
     * buttons, and args to run various functions
     * @param {ActionForm | MessageForm | ModalForm<any>} form form that is used in this call
     * @param {Player} player
     * @param {Function} callback
     */
    constructor(form: ActionForm | MessageForm | ModalForm<any>, player: Player, callback: Function);
    /**
     * form that was used in this call
     * @type {ActionForm | MessageForm | ModalForm<any>}
     * @private
     */
    private form;
    /**
     * player that this form used
     * @type {Player}
     * @private
     */
    private player;
    /**
     * the function that was called
     * @type {Function}
     * @private
     */
    private callback;
    /**
     * Reshows the form and shows the user a error message
     * @param {string} message  error message to show
     * @returns {void}
     */
    error(message: string): void;
}
import { ActionFormData } from "@minecraft/server-ui";
import { ModalFormData } from "@minecraft/server-ui";
import { MessageFormData } from "@minecraft/server-ui";
import { Player } from "@minecraft/server";
import { ActionFormResponse } from "@minecraft/server-ui";
import { MessageFormResponse } from "@minecraft/server-ui";
import { ModalFormResponse } from "@minecraft/server-ui";
import { ActionForm } from "./ActionForm.js";
import { MessageForm } from "./MessageForm.js";
import { ModalForm } from "./ModelForm.js";
