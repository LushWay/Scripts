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
		const subSetDefaults =
			typeof defaultValue === "object" &&
			defaultValue !== null &&
			!visited.has(value);

		if (value === defaultValue) continue;

		if (subSetDefaults) {
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
