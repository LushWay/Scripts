/**
 * @template {Function} [Callback = (ctx: FormCallback) => void]
 */
export class ModalForm<Callback extends Function = (ctx: FormCallback) => void> {
    /**
     * Creates a new form to be shown to a player
     * @param {string} title the title that this form should have
     */
    constructor(title: string);
    title: string;
    /**
     * The default minecraft form this form is based on
     * @type {ModalFormData}
     * @private
     */
    private form;
    /**
     * The arguments this form has
     * @type {IModalFormArg[]}
     * @private
     */
    private args;
    triedToShow: number;
    /**
     * Adds a dropdown to this form
     * @template {ReadonlyArray<string>} T
     * @param {string} label  label to show on dropdown
     * @param {T} options  the availiabe options for this dropdown
     * @param {number} defaultValueIndex  the default value index
     * @returns {ModalForm<AppendFormField<Callback, T[number]>>} this
     */
    addDropdown<T extends readonly string[]>(label: string, options: T, defaultValueIndex?: number): ModalForm<AppendFormField<Callback, T_1[number]>>;
    /**
     * Adds a slider to this form
     * @param {string} label  label to be shown on this slider
     * @param {number} minimumValue  the smallest value this can be
     * @param {number} maximumValue  the maximum value this can be
     * @param {number} valueStep  how this slider increments
     * @param {number} defaultValue  the default value in slider
     * @returns {ModalForm<AppendFormField<Callback, number>>}
     */
    addSlider(label: string, minimumValue: number, maximumValue: number, valueStep?: number, defaultValue?: number): ModalForm<AppendFormField<Callback, number>>;
    /**
     * Adds a toggle to this form
     * @param {string} label  the name of this toggle
     * @param {boolean} defaultValue  the default toggle value could be true or false
     * @returns {ModalForm<AppendFormField<Callback, boolean>>}
     */
    addToggle(label: string, defaultValue: boolean): ModalForm<AppendFormField<Callback, boolean>>;
    /**
     * Adds a text field to this form
     * @param {string} label  label for this textField
     * @param {string} placeholderText  the text that shows on this field
     * @param {string} [defaultValue]  the default value that this field has
     * @returns {ModalForm<AppendFormField<Callback, string>>}
     */
    addTextField(label: string, placeholderText: string, defaultValue?: string): ModalForm<AppendFormField<Callback, string>>;
    /**
     * Shows this form to a player
     * @param {Player} player  player to show to
     * @param {Callback} callback  sends a callback when this form is submited
     * @returns {Promise<void>}
     */
    show(player: Player, callback: Callback): Promise<void>;
}
import { FormCallback } from "./utils.js";
import { Player } from "@minecraft/server";
