import { Container, ItemStack } from "@minecraft/server";
export class BlockInventory {
	/** @type {number} */
	emptySlotsCount;
	/** @type {number} */
	size;
	/** @type {Array<ItemStack>} */
	items;
	/**
	 * Coverts a blockInventoryComponentContainer and saves it
	 * @param {Container} inventory
	 */
	constructor(inventory) {
		this.emptySlotsCount = inventory.emptySlotsCount;
		this.size = inventory.size;
		this.items = [];
		for (let i = 0; i < this.size; i++) {
			this.items[i] = inventory.getItem(i);
		}
	}

	/**
	 * Loads this inventory onto a BlockInventoryComponentContainer
	 * @param {Container} block block to load on
	 */
	load(block) {
		for (let i = 0; i < block.size; i++) {
			if (!this.items[i]) continue;
			block.setItem(i, this.items[i]);
		}
	}
}
