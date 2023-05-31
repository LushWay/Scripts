import {
	Entity,
	EquipmentSlot,
	ItemStack,
	MinecraftItemTypes,
	Player,
	system,
} from "@minecraft/server";
import { util } from "../Setup/utils.js";
import { DB } from "./Default.js";

const TABLE_TYPE = "inventory";

/**
 * @typedef {Exclude<keyof typeof EquipmentSlot, 'mainhand'>} Equipment
 */

/**
 * @typedef {{
 *   slots: ItemStack[];
 *   equipment: Partial<Record<Equipment, ItemStack>>
 *   xp: number;
 *   health: number;
 * }} Inventory
 */

/**
 * @typedef {{
 *   owner: string,
 *   slots: Array<number | Equipment>
 *   xp: number;
 *   health: number;
 * }} StoreManifest
 */

export class InventoryStore {
	/**
	 * The function loads equipment and inventory items from inventory object to entity in a game.
	 * @param {Player} to - The entity that is receiving the equipment and inventory items being loaded.
	 * @param {Inventory} from - The object from which the equipment and inventory items are being loaded.
	 * @param {object} o
	 * @param {boolean} [o.clearAll] - Boolean that determines clear entity inventory before loading or not
	 */
	static load(to, from, { clearAll = true } = {}) {
		const equipment = to.getComponent("equipment_inventory");
		equipment.setEquipment(EquipmentSlot.offhand, from.equipment.offhand);
		equipment.setEquipment(EquipmentSlot.head, from.equipment.head);
		equipment.setEquipment(EquipmentSlot.chest, from.equipment.chest);
		equipment.setEquipment(EquipmentSlot.legs, from.equipment.legs);
		equipment.setEquipment(EquipmentSlot.feet, from.equipment.feet);

		to.resetLevel();
		to.addExperience(from.xp);

		to.getComponent("health").setCurrentValue(from.health);

		const { container } = to.getComponent("inventory");
		if (clearAll) container.clearAll();
		for (const [i, item] of from.slots.entries()) {
			if (item) container.setItem(i, item);
		}
	}

	/**
	 * The function returns an object containing the equipment and inventory slots of a game entity.
	 * @param {Player} from - The entity  from which we are retrieving the
	 * equipment and inventory information. It is used to access the "equipment_inventory" and "inventory"
	 * components of the entity.
	 * @returns {Inventory}
	 */
	static get(from) {
		const equipment = from.getComponent("equipment_inventory");
		const { container } = from.getComponent("inventory");
		const xp = from.getTotalXp();
		const health = from.getComponent("health").currentValue;

		return {
			xp,
			health,
			equipment: {
				offhand: equipment.getEquipment(EquipmentSlot.offhand),
				head: equipment.getEquipment(EquipmentSlot.head),
				chest: equipment.getEquipment(EquipmentSlot.chest),
				legs: equipment.getEquipment(EquipmentSlot.legs),
				feet: equipment.getEquipment(EquipmentSlot.feet),
			},
			slots: new Array(container.size)
				.fill(undefined)
				.map((_, i) => container.getItem(i)),
		};
	}
	_ = {
		TABLE_TYPE,
		TABLE_NAME: "",
		/**
		 * List of all loaded entities
		 * @type {Entity[]}
		 */
		ENTITIES: [],
		/**
		 * List of all loaded stores
		 * @type {Record<string, Inventory>}
		 */
		STORES: {},
	};
	/**
	 * Creates new inventory store manager
	 * @param {string} tableName
	 */
	constructor(tableName) {
		this._.TABLE_NAME = tableName;
		this.init();
	}
	/** @private */
	init() {
		this._.ENTITIES = DB.getTableEntities(this._.TABLE_TYPE, this._.TABLE_NAME);

		const items = [];

		for (const entity of this._.ENTITIES) {
			const { container } = entity.getComponent("inventory");

			for (let i = 0; i < container.size; i++) {
				const item = container.getItem(i);
				if (!item) break;
				items.push(item);
			}
		}

		/** @type {Inventory} */
		let store = {
			xp: 0,
			health: 20,
			equipment: {},
			slots: [],
		};
		/** @type {Record<number, {type: 'equipment' | 'slots', index: Equipment | number}>} */
		let slots = [];
		let step = 0;
		let owner = "";

		for (const item of items) {
			const lore = item.getLore();
			const raw = lore[0];

			// Finding manifest
			if (raw && raw[0] === "{" && raw[raw.length - 1] === "}") {
				/** @type {StoreManifest} */
				const manifest = JSON.safeParse(raw);

				// No data means that this isnt manifest, do nothing
				if (manifest) {
					// Saving previosly parsed inventory if exists
					if (owner) {
						this._.STORES[owner] = store;
						store = {
							xp: 0,
							health: 20,
							equipment: {},
							slots: [],
						};
					}

					owner = manifest.owner;
					step = 0;
					store.health = manifest.health;
					store.xp = manifest.xp;
					slots = manifest.slots.map((e) => {
						return {
							type: typeof e === "string" ? "equipment" : "slots",
							index: e,
						};
					});
					continue;
				}
			}

			if (!slots)
				return util.error(
					new Error(
						`Failed to load InventoryStore(${this._.TABLE_NAME}): No manifest found!`
					),
					{ errorName: "LoadError" }
				);

			const { type, index } = slots[step];
			// @ts-expect-error Optimization cost...
			store[type][index] = item;

			step++;
		}

		if (owner) {
			this._.STORES[owner] = store;
		}
	}
	/** @private */
	save() {
		/** @type {ItemStack[]} */
		const items = [];

		for (const owner in this._.STORES) {
			const store = this._.STORES[owner];
			const storeIndex = items.length;

			/** @type {StoreManifest} */
			const manifest = {
				health: store.health,
				xp: store.xp,
				owner,
				slots: [],
			};

			for (const key of Object.keys(store.equipment)) {
				if (!store.equipment[key]) continue;
				const move = manifest.slots.push(key);
				items[storeIndex + move] = store.equipment[key];
			}

			for (const [key, stack] of store.slots.entries()) {
				if (!stack) continue;
				const move = manifest.slots.push(key);
				items[storeIndex + move] = stack;
			}

			const item = new ItemStack(MinecraftItemTypes.acaciaBoat);
			item.setLore([JSON.stringify(manifest)]);
			items[storeIndex] = item;
		}

		const totalEntities = Math.ceil(items.length / DB.INVENTORY_SIZE);
		const entities = DB.getTableEntities(this._.TABLE_TYPE, this._.TABLE_NAME);
		const entitiesToSpawn = totalEntities - entities.length;

		if (entitiesToSpawn > 0) {
			for (let i = 0; i < entitiesToSpawn; i++) {
				entities.push(
					DB.createTableEntity(this._.TABLE_TYPE, this._.TABLE_NAME, i)
				);
			}
		} else if (entitiesToSpawn < 0) {
			// Check for unused entities and despawn them
			for (let i = totalEntities; i >= entities.length; i--) {
				entities[i].triggerEvent("minecraft:despawn");
			}
		}

		let itemIndex = 0;
		for (const [i, entity] of entities.entries()) {
			const { container } = entity.getComponent("inventory");
			container.clearAll();

			for (let i = 0; i < container.size; i++) {
				container.setItem(i, items[itemIndex]);
				itemIndex++;
			}
			entity.setDynamicProperty("index", i);
		}

		this._.ENTITIES = entities;

		DB.backup();
	}
	/**
	 * @type {boolean}
	 * @private
	 */
	SAVING = true;
	/** @private */
	requestSave() {
		if (this.SAVING) return;

		system.runTimeout(
			() => {
				this.save();
				this.SAVING = false;
			},
			"inventorySave",
			40
		);
		this.SAVING = true;
	}
	/**
	 * Gets entity store from saved and removes to avoid bugs
	 * @param {string} entityID - The ID of the entity whose store is being retrieved.
	 * @param {boolean} remove - A boolean parameter that determines whether the entity store should be
	 * removed from the internal stores object after it has been retrieved. If set to true, the store will
	 * be deleted from the object. If set to false, the store will remain in the object.
	 * @returns the entity store associated with the given entity ID.
	 */
	getEntityStore(entityID, remove = true) {
		if (!(entityID in this._.STORES))
			throw new ReferenceError("Not found inventory!");

		const store = this._.STORES[entityID];
		if (remove) delete this._.STORES[entityID];
		return store;
	}
	/**
	 * Saves an player inventory to a store and requests a save.
	 * @param {Player} entity - The entity object that needs to be saved in the store.
	 * @param {object} options - Options
	 * @param {boolean} [options.rewrite] - A boolean parameter that determines whether or not to allow rewriting of an
	 * existing entity in the store. If set to false and the entity already exists in the store, a
	 * ReferenceError will be thrown. If set to true, the existing entity will be overwritten with the new
	 * entity.
	 * @param {boolean} [options.keepInventory] - A boolean that determines keep entity's invetory or not
	 */
	saveFromEntity(entity, { rewrite = false, keepInventory = false } = {}) {
		if (entity.id in this._.STORES && !rewrite)
			throw new ReferenceError(
				"Failed to rewrite entity store with disabled rewriting."
			);
		this._.STORES[entity.id] = InventoryStore.get(entity);
		if (!keepInventory) entity.getComponent("inventory").container.clearAll();

		this.requestSave();
	}
}
