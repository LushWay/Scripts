import { Entity, EquipmentSlot, ItemStack, Player } from "@minecraft/server";

const TABLE_TYPE = "inventory";

/**
 * @typedef {{
 *   slots: ItemStack[];
 *   equipment: Record<Exclude<keyof typeof EquipmentSlot, 'mainhand'>, ItemStack>
 * }} Inventory
 */

export const InventoryManager = {
	/**
	 *
	 * @param {Entity} to
	 */
	load(to) {},
	/**
	 *
	 * @param {Entity | Inventory} from
	 */
	saveFrom(from) {
		if (from instanceof Entity) from = this.get(from);
	},
	/**
	 * Returns inventory of entity
	 * @param {Entity} from
	 * @returns {Inventory}
	 */
	get(from) {
		return;
	},
	/**
	 * Swaps entity inventory and saved to manager inventory
	 * @param {Entity} entity
	 */
	swap(entity) {
		const inventoryToSave = this.get(entity);
		this.load(entity);
		this.saveFrom(inventoryToSave);
	},
};

export class InventoryStore {
	_ = {
		ENTITY: {},
		TABLE_TYPE,
		TABLE_NAME: "",
	};
	/**
	 *
	 * @param {Entity} entity
	 */
	constructor(entity) {
		this._.TABLE_NAME = entity.id;
		this._.ENTITY = entity;
	}
}

const player = Player.prototype;
// const manager = new InventoryManager("");

// const oldInv = manager.getFrom(player);
// manager.loadTo(player);
// manager.saveFrom(oldInv);
