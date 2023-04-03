import {
	DynamicPropertiesDefinition,
	Entity,
	EntityTypes,
	Vector,
	world,
} from "@minecraft/server";
import { DisplayError } from "../Setup/utils.js";

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
	let def = new DynamicPropertiesDefinition();
	def.defineString("tableName", 30);
	def.defineString("tableType", 30);
	def.defineNumber("index");
	propertyRegistry.registerEntityTypeDynamicProperties(
		def,
		EntityTypes.get(DB.ENTITY_IDENTIFIER)
	);
});

/**
 * @typedef {{
 *   entity: Entity;
 *   index: number;
 *   tableName: string | number | boolean;
 *   tableType: string | number | boolean;
 * }} TABLE
 */

export class DB {
	/**
	 * Creates a table entity that is used for data storage
	 * @param {string} tableName  undefined
	 * @param {string} tableType
	 * @param {number} [index] if not specified no index will be set
	 * @returns {Entity} *
	 */
	static createTableEntity(tableName, tableType, index = 0) {
		const entity = world.overworld.spawnEntity(
			DB.ENTITY_IDENTIFIER,
			DB.ENTITY_LOCATION
		);

		entity.setDynamicProperty("tableName", tableName);
		entity.setDynamicProperty("tableType", tableType);
		entity.setDynamicProperty("index", index);
		entity.nameTag = `§7DB §f${tableName} `;

		entity.runCommand("structure save database ~~~ ~~~ true disk false");

		return entity;
	}
	/**
	 * A function that returns an array of entities that have the same tableType and tableName.
	 * @param {string} tableType
	 * @param {string} tableName
	 * @returns
	 */
	static getTableEntities(tableType, tableName) {
		try {
			return this.loadTables()
				.filter((e) => e.tableType === tableType && e.tableName === tableName)
				.sort((a, b) => a.index - b.index)
				.map((e) => e.entity);
		} catch (e) {
			DisplayError(e);
			return [];
		}
	}
	static ENTITY_IDENTIFIER = "rubedo:database";
	static ENTITY_LOCATION = { x: 0, y: -64, z: 0 };
	static INVENTORY_SIZE = 54;
	static CHUNK_REGEXP = /.{1,32000}/g;
	static MAX_LORE_SIZE = 32000;
	static BACKUP_NAME = "database";
	/**
	 * @type {TABLE[]}
	 * @private
	 */
	static ALL_TABLE_ENTITIES;
	static LOAD_TRY = 0;
	/**
	 * @private
	 * @returns {TABLE[]}
	 */
	static loadTables() {
		this.ALL_TABLE_ENTITIES ??= world.overworld
			.getEntities({ type: DB.ENTITY_IDENTIFIER })
			.map((entity) => {
				let index = entity.getDynamicProperty("index");
				if (typeof index !== "number") index = 0;

				const tableType = entity.getDynamicProperty("tableType");
				const tableName = entity.getDynamicProperty("tableName");

				if (typeof tableName !== "string" || typeof tableType !== "string")
					return { entity, index, tableName: "NOTDB", tableType: "NONE" };

				if (Vector.distance(entity.location, DB.ENTITY_LOCATION) > 1) {
					entity.teleport(DB.ENTITY_LOCATION);
				}

				return {
					entity,
					index,
					tableName,
					tableType,
				};
			})
			.filter((e) => e.tableName !== "NOTDB");

		this.LOAD_TRY++;

		if (this.ALL_TABLE_ENTITIES.length < 1) {
			if (this.LOAD_TRY === 1) {
				console.warn(
					"§6Не удалось найти базы данных. Попытка загрузить бэкап..."
				);
				world.overworld.runCommand(
					`structure load ${DB.BACKUP_NAME} ${Vector.string(
						DB.ENTITY_LOCATION
					)}`
				);
				return this.loadTables();
			} else if (this.LOAD_TRY === 2) {
				this.LOAD_TRY = 3;
				console.warn("§cНе удалось загрузить базы данных из бэкапа.");
				return [];
			}
		} else if (this.LOAD_TRY === 2)
			console.warn(
				"Бэкап успешно загружен! Всего баз данных: " +
					this.ALL_TABLE_ENTITIES.length
			);

		return this.ALL_TABLE_ENTITIES;
	}

	/**
	 * @template {JSONLike} O
	 * @template {JSONLike} D
	 * @param {O} sourceObject
	 * @param {D} defaultObject
	 * @returns {O & D}
	 */
	static setDefaults(sourceObject, defaultObject) {
		// Create a new object to avoid modifying the original object
		/** @type {JSONLike}*/
		const COMPOSED = {};

		// Copy properties from the defaults object
		for (const key in defaultObject) {
			const value = sourceObject[key];
			const defaultValue = defaultObject[key];

			if (typeof defaultValue === "object" && defaultValue !== null) {
				// Value is Object or array, recurse...

				if (Array.isArray(defaultValue)) {
					if (key in sourceObject) {
						COMPOSED[key] = [...value];
					} else {
						COMPOSED[key] = [...defaultValue];
					}
				} else {
					if (key in sourceObject) {
						COMPOSED[key] = this.setDefaults(value, defaultValue);
					} else {
						// If the original object doesn't have the property, add default value
						// And unlink properties...
						COMPOSED[key] = Object.assign({}, defaultValue);
					}
				}
			} else {
				// Primitive value, assign
				COMPOSED[key] = defaultValue;
			}
		}

		// Copy properties from the original object
		for (const key in sourceObject) {
			// If the property is not in the result object, copy it from the original object
			if (!(key in COMPOSED)) {
				COMPOSED[key] = sourceObject[key];
			}
		}

		return COMPOSED;
	}

	/**
	 *
	 * @template {JSONLike} S
	 * @param {S} sourceObject
	 * @param {JSONLike} defaultObject
	 * @returns {S}
	 */
	static removeDefaults(sourceObject, defaultObject) {
		// Create a new object to avoid modifying the original object
		/** @type {JSONLike} */
		const COMPOSED = {};

		for (const key in sourceObject) {
			const value = sourceObject[key];
			const defaultValue = defaultObject[key];

			if (value === defaultValue) continue;

			if (typeof defaultValue === "object" && defaultValue !== null) {
				if (Array.isArray(defaultValue)) {
					//
					if (value.length < 1 || Array.equals(value, defaultValue)) continue;

					COMPOSED[key] = value;
				} else {
					//
					const composedSubObject = this.removeDefaults(value, defaultValue);
					if (Object.keys(composedSubObject).length < 1) continue;

					COMPOSED[key] = composedSubObject;
				}
			} else {
				// Primitive value, assign
				COMPOSED[key] = defaultValue;
			}
		}

		return COMPOSED;
	}

	/** @protected */
	constructor() {}
}
