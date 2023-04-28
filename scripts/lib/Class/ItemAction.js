import { ItemUseAfterEvent } from "@minecraft/server";

export class ItemAction {
	/** @type {Record<string, Function>} */
	static ACTIONS = {};
	/**
	 *
	 * @param {string} typeId
	 * @param {(data: ItemUseAfterEvent) => void} action
	 */
	constructor(typeId, action) {
		ItemAction.ACTIONS[typeId] = action;
	}
}
