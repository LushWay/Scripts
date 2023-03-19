/** */
export class ActionForm {
    /**
     * Creates a new form to be shown to a player
     * @param {string} title the title that this form should have
     * @param {string} [body] extra text that should be displayed in the form
     */
    constructor(title: string, body?: string);
    /**
     * The buttons this form has
     * @type {IActionFormButton[]}
     * @private
     */
    private buttons;
    /**
     * The default minecraft form this form is based on
     * @type {ActionFormData}
     * @private
     */
    private form;
    title: string;
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
    addButton(text: string, iconPath: string, callback: ButtonCallback): ActionForm;
    /**
     * Shows this form to the player
     * @param {Player} player  player to show to
     * @returns {Promise<void>}
     */
    show(player: Player): Promise<void>;
}
import { Player } from "@minecraft/server";
