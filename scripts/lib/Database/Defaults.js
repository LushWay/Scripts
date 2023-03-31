import {
	DynamicPropertiesDefinition,
	EntityTypes,
	world,
} from "@minecraft/server";

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

export const DB = {
	ENTITY_IDENTIFIER: "rubedo:database",
	ENTITY_LOCATION: { x: 0, y: -64, z: 0 },
	INVENTORY_SIZE: 54,
	CHUNK_REGEXP: /.{1,32000}/g,
	MAX_LORE_SIZE: 32000,
};

/**
 * @typedef {Record<string | symbol | number, any>} JSON_OBJECT
 */

/**
 *
 * @template {JSON_OBJECT} O
 * @template {JSON_OBJECT} D
 * @param {O} original
 * @param {D} defaults
 * @returns {O & D}
 */
export function setDefaults(original, defaults) {
	// Create a new object to avoid modifying the original object
	/**
	 * @type {JSON_OBJECT}
	 */
	const COMPOSED = {};

	// Copy properties from the defaults object
	for (const key in defaults) {
		const def = defaults[key];

		// If the property is an object, recurse
		if (typeof def === "object" && def !== null && !Array.isArray(def)) {
			if (
				typeof original === "object" &&
				original !== null &&
				!(key in original)
			) {
				// If the original object doesn't have the property, add it with the default value
				COMPOSED[key] = setDefaults({}, def);
			} else {
				// Otherwise, merge the original and default objects recursively
				COMPOSED[key] = setDefaults(original[key], def);
			}
		} else {
			// If the property is not an object, copy it from the defaults object
			COMPOSED[key] = def;
		}
	}

	// Copy properties from the original object
	for (const key in original) {
		// If the property is not in the result object, copy it from the original object
		if (!(key in COMPOSED)) {
			COMPOSED[key] = original[key];
		}
	}

	return COMPOSED;
}

/**
 *
 * @template {JSON_OBJECT} S
 * @param {S} sourceObject
 * @param {JSON_OBJECT} defaultObject
 * @returns {S}
 */
export function removeDefaults(
	sourceObject,
	defaultObject,
	visited = new WeakSet()
) {
	/** @type {JSON_OBJECT} */
	const composed = {};

	for (const key in sourceObject) {
		const value = sourceObject[key];
		const defaultValue = defaultObject[key];

		if (value === defaultValue) continue;

		if (
			typeof defaultValue === "object" &&
			defaultValue !== null &&
			!visited.has(value)
		) {
			if (Array.isArray(defaultValue)) {
				const composedArray = removeDefaultsFromArray(value, defaultValue);
				if (composedArray.length < 1) continue;
				composed[key] = composedArray;
			} else {
				const composedSubObject = removeDefaults(value, defaultValue, visited);
				if (Object.keys(composedSubObject).length < 1) continue;
				composed[key] = composedSubObject;
			}
		} else composed[key] = value;
	}

	return composed;
}
/**
 *
 * @template T
 * @param {T[]} source
 * @param {T[]} defaults
 * @returns {T[]}
 */
function removeDefaultsFromArray(source, defaults) {
	const composed = [];

	for (const value of source) {
		if (defaults.includes(value)) continue;
		composed.push(value);
	}

	return composed;
}

