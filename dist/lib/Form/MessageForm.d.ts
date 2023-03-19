/** */
export class MessageForm {
    /**
     * Creates a new form to be shown to a player
     * @param {string} title the title that this form should have
     * @param {string} body extra text that should be displayed in the form
     */
    constructor(title: string, body: string);
    /**
     *  the title that this form should have
     * @type {string}
     */
    title: string;
    /**
     * extra text that should be displayed in the form
     * @type {string}
     */
    body: string;
    /**
     * The default minecraft form this form is based on
     * @type {MessageFormData}
     * @private
     */
    private form;
    /**
     * the first button of the dialog.
     * @type {IMessageFormButton}
     * @private
     */
    private button1;
    /**
     * the seccond button of the dialog.
     * @type {IMessageFormButton}
     * @private
     */
    private button2;
    triedToShow: number;
    /**
     * Method that sets the text for the first button of the dialog.
     * @param {string} text  text to show on this button
     * @param {ButtonCallback} callback  what happens when this button is clicked
     * @example ```
     * setButton1("settings", () => {})
     * ```
     * @returns {MessageForm}
     */
    setButton1(text: string, callback: ButtonCallback): MessageForm;
    /**
     * Method that sets the text for the second button of the dialog.
     * @param {string} text  text to show on this button
     * @param {ButtonCallback} callback  what happens when this button is clicked
     * @example ```
     * setButton2("settings", () => {})
     * ```
     * @returns {MessageForm}
     */
    setButton2(text: string, callback: ButtonCallback): MessageForm;
    /**
     * Shows this form to the player
     * @param {Player} player  player to show to
     * @returns {Promise<void>}
     */
    show(player: Player): Promise<void>;
}
import { Player } from "@minecraft/server";
