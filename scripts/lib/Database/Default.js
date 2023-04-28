import {
	DynamicPropertiesDefinition,
	Entity,
	EntityTypes,
	Vector,
	system,
	world,
} from "@minecraft/server";
import { DisplayError } from "../Setup/utils.js";

world.afterEvents.worldInitialize.subscribe(({ propertyRegistry }) => {
	let def = new DynamicPropertiesDefinition();
	def.defineString("tableName", 30);
	def.defineString("tableType", 30);
	def.defineNumber("index");
	propertyRegistry.registerEntityTypeDynamicProperties(
		def,
		EntityTypes.get(DB.ENTITY_IDENTIFIER)
	);

	world.overworld.runCommandAsync(
		"tickingarea add 0 -64 0 0 200 0 database true"
	);
});

/**
 * @typedef {{
 *   entity: Entity;
 *   tableName: string
 *   tableType: string
 *   index: number
 * }} TABLE
 */

export class DB {
	static ENTITY_IDENTIFIER = "rubedo:database";
	static ENTITY_LOCATION = { x: 0, y: -64, z: 0 };
	static INVENTORY_SIZE = 96;
	static CHUNK_REGEXP = /.{1,32000}/g;
	static MAX_LORE_SIZE = 32000;
	/**
	 * @type {TABLE[]}
	 * @private
	 */
	static ALL_TABLE_ENTITIES;
	static LOAD_TRY = 0;
	/**
	 * @private
	 */
	static getEntities() {
		return world.overworld
			.getEntities({ type: DB.ENTITY_IDENTIFIER })
			.map((entity) => {
				const tableType = entity.getDynamicProperty("tableType");
				const tableName = entity.getDynamicProperty("tableName");
				const index = entity.getDynamicProperty("index");

				if (
					typeof tableName !== "string" ||
					typeof tableType !== "string" ||
					typeof index !== "number"
				)
					return { entity, tableName: "NOTDB", tableType: "NONE", index: 0 };

				if (Vector.distance(entity.location, DB.ENTITY_LOCATION) > 1) {
					entity.teleport(DB.ENTITY_LOCATION);
				}

				return {
					entity,
					tableName,
					tableType,
					index,
				};
			})
			.filter((e) => e.tableName !== "NOTDB");
	}
	/**
	 * @private
	 * @returns {TABLE[]}
	 */
	static tables() {
		if (this.ALL_TABLE_ENTITIES) return this.ALL_TABLE_ENTITIES;
		this.ALL_TABLE_ENTITIES = this.getEntities();

		if (this.ALL_TABLE_ENTITIES.length < 1) {
			console.warn(
				"§6Не удалось найти базы данных. Попытка загрузить бэкап..."
			);
			world.overworld
				.getEntities({
					location: DB.ENTITY_LOCATION,
					type: DB.ENTITY_IDENTIFIER,
					maxDistance: 2,
				})
				.forEach((e) => e.triggerEvent("minecraft:despawn"));
			world.overworld.runCommand(
				`structure load ${DB.BACKUP_NAME} ${Vector.string(DB.ENTITY_LOCATION)}`
			);
			this.ALL_TABLE_ENTITIES = this.getEntities();

			if (this.ALL_TABLE_ENTITIES.length < 1) {
				console.warn("§cНе удалось загрузить базы данных из бэкапа.");
				return [];
			} else
				console.warn(
					"Бэкап успешно загружен! Всего баз данных: " +
						this.ALL_TABLE_ENTITIES.length
				);
		}

		return this.ALL_TABLE_ENTITIES;
	}
	/**
	 * Creates a table entity that is used for data storage
	 * @param {string} tableType
	 * @param {string} tableName
	 * @param {number} index
	 * @returns {Entity}
	 */
	static createTableEntity(tableType, tableName, index = 0) {
		const entity = world.overworld.spawnEntity(
			DB.ENTITY_IDENTIFIER,
			DB.ENTITY_LOCATION
		);

		entity.setDynamicProperty("tableName", tableName);
		entity.setDynamicProperty("tableType", tableType);
		entity.setDynamicProperty("index", index);
		entity.nameTag = `§7DB §f${tableName} `;

		return entity;
	}
	/**
	 * A function that returns an array of entities that have the same tableType and tableName.
	 * @param {string} tableType
	 * @param {string} tableName
	 * @returns
	 */
	static getTableEntity(tableType, tableName) {
		try {
			return this.tables().find(
				(e) => e.tableType === tableType && e.tableName === tableName
			)?.entity;
		} catch (e) {
			DisplayError(e);
			return null;
		}
	}
	/**
	 * A function that returns an array of entities that have the same tableType and tableName.
	 * @param {string} tableType
	 * @param {string} tableName
	 * @returns
	 */
	static getTableEntities(tableType, tableName) {
		try {
			return this.tables()
				.filter((e) => e.tableType === tableType && e.tableName === tableName)
				.sort((a, b) => a.index - b.index)
				.map((e) => e.entity);
		} catch (e) {
			DisplayError(e);
			return null;
		}
	}

	static BACKUP_NAME = "database";
	static BACKUP_LOCATION = Vector.string(this.ENTITY_LOCATION);
	static BACKUP_COMMAND = `structure save ${this.BACKUP_NAME} ${this.BACKUP_LOCATION} ${this.BACKUP_LOCATION} true disk false`;
	/**
	 * @private
	 */
	static WAITING_FOR_BACKUP = false;
	static backup() {
		if (this.WAITING_FOR_BACKUP) return;

		system.runTimeout(
			() => {
				this.WAITING_FOR_BACKUP = false;
				world.overworld.runCommand(this.BACKUP_COMMAND);
			},
			"database backup",
			200
		);
		this.WAITING_FOR_BACKUP = true;
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

				if (
					Array.isArray(defaultValue) &&
					typeof value !== "undefined" &&
					Array.isArray(value)
				) {
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
				COMPOSED[key] = typeof value === "undefined" ? defaultValue : value;
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

			if (
				typeof defaultValue === "object" &&
				defaultValue !== null &&
				typeof value === "object"
			) {
				if (Array.isArray(defaultValue)) {
					//
					if (!value?.length || Array.equals(value, defaultValue)) continue;

					COMPOSED[key] = value;
				} else {
					//
					const composedSubObject = this.removeDefaults(value, defaultValue);
					if (Object.keys(composedSubObject).length < 1) continue;

					COMPOSED[key] = composedSubObject;
				}
			} else {
				// Primitive value, assign
				COMPOSED[key] = value;
			}
		}

		return COMPOSED;
	}

	/** @protected */
	constructor() {}
}

export class DatabaseError extends Error {
	/**
	 *
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
	}
}
