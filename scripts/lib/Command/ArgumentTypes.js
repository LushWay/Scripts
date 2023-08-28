import { Player, world } from "@minecraft/server";

/**
 * @abstract
 *
 */
export class IArgumentType {
	/**
	 * The return type
	 * @type {any}
	 */
	type;
	/**
	 * The name that the help for this command will see
	 * @example "string"
	 * @example "Location"
	 * @example "int"
	 * @example "number"
	 * @example "UnitType"
	 * @type {string}
	 */
	typeName;
	/**
	 * The name this argument is
	 * @type {string}
	 */
	name = "name";
	/**
	 * Argument optionality
	 * @type {boolean}
	 */
	optional = false;
	/**
	 * Checks if a value matches this argument type, also
	 * returns the corridsponding type
	 * @param {string} value
	 * @returns {import("./types.js").IArgumentReturnData<any>}
	 */
	matches(value) {
		return {
			success: false,
		};
	}
	constructor(name = "any", optional = false) {}
}

/**
 * @implements {IArgumentType}
 */
export class LiteralArgumentType {
	/**
	 * @type {null}
	 */
	type;
	typeName = "literal";
	optional;
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		return {
			success: this.name === value,
		};
	}
	/**
	 *
	 * @param {string} name
	 * @param {boolean} optional
	 */
	constructor(name = "literal", optional = false) {
		this.optional = optional;
		this.name = name;
	}
}

/**
 * @implements {IArgumentType}
 */
export class StringArgumentType {
	/**
	 * @type {string}
	 */
	type;
	typeName = "§3string";
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		return {
			success: !!value,
			value: value,
		};
	}
	/**
	 *
	 * @param {string} name
	 * @param {boolean} optional
	 */
	constructor(name = "string", optional = false) {
		this.optional = optional;
		this.name = name;
	}
}

/**
 * @implements {IArgumentType}
 */
export class IntegerArgumentType {
	/** @type {number} */
	type;
	optional;
	typeName = "int";
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		const val = parseInt(value);
		return {
			success: !isNaN(val),
			value: val,
		};
	}
	/**
	 *
	 * @param {string} name
	 * @param {boolean} optional
	 */
	constructor(name = "integer", optional = false) {
		this.optional = optional;
		this.name = name;
	}
}

/**
 * @implements {IArgumentType}
 */
export class FloatArgumentType {
	/** @type {number} */
	type;
	optional;
	typeName = "float";
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		return {
			success: /^\d+\.\d+$/.test(value),
			value: parseInt(value),
		};
	}
	/**
	 *
	 * @param {string} name
	 * @param {boolean} optional
	 */
	constructor(name = "float", optional = false) {
		this.optional = optional;
		this.name = name;
	}
}

/**
 * @implements {IArgumentType}
 */
export class LocationArgumentType {
	/** @type {Vector3} */
	type;
	optional;
	typeName = "location";
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		const result = /^(([~^]?-?\d+)|(~|\^))$/g.test(value);

		return {
			success: result,
			value: value,
		};
	}
	/**
	 *
	 * @param {string} name
	 * @param {boolean} optional
	 */
	constructor(name = "location", optional = false) {
		this.optional = optional;
		this.name = name;
	}
}

/**
 * @implements {IArgumentType}
 */
export class BooleanArgumentType {
	/** @type {boolean} */
	type;
	optional;
	typeName = "boolean";
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		return {
			success: /^(true|false)$/g.test(value),
			value: value == "true" ? true : false,
		};
	}

	constructor(name = "boolean", optional = false) {
		this.optional = optional;
		this.name = name;
	}
}

/**
 * @implements {IArgumentType}
 */
export class PlayerArgumentType {
	/** @type {Player} */
	type;
	optional;
	typeName = "playerName";
	/**
	 * @param {string} value
	 */
	matches(value) {
		const p = world.getAllPlayers().find((player) => player.name === value);
		return {
			success: p ? true : false,
			value: p,
		};
	}
	constructor(name = "player", optional = false) {
		this.optional = optional;
		this.name = name;
	}
}

/**
 * @implements {IArgumentType}
 */
export class TargetArgumentType {
	/** @type {string} */
	type;
	optional;
	typeName = "Target";
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		return {
			success: Boolean(value?.match(/^(@.+|"[^"]+")$/)?.[0]),
			value: value,
		};
	}
	constructor(name = "target", optional = false) {
		this.optional = optional;
		this.name = name;
	}
}

/**
 * @implements {IArgumentType}
 * @template {ReadonlyArray<string>} T
 */
export class ArrayArgumentType {
	/** @type {T[number]} */
	type;
	optional;
	typeName = "string";
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		return {
			success: this.types.includes(value),
			value: value,
		};
	}
	/**
	 *
	 * @param {string} name
	 * @param {T} types
	 * @param {boolean} optional
	 */
	constructor(name = "array", types, optional = false) {
		this.optional = optional;
		this.name = name;
		this.types = types;

		this.typeName = types.join(" | ").replace(/(.{25})..+/, "$1...");
	}
}

/**
 * @implements {IArgumentType}
 */
export class UnitArgumentType {
	/** @type {import("./types.js").MSValueType} */
	type;
	optional;
	typeName = "UnitValueType";
	/**
	 *
	 * @param {string} value
	 * @returns
	 */
	matches(value) {
		const result = ![
			"years",
			"yrs",
			"weeks",
			"days",
			"hours",
			"hrs",
			"minutes",
			"mins",
			"seconds",
			"secs",
			"milliseconds",
			"msecs",
			"ms",
		].includes(value);

		return {
			success: result,
			value: result ? value : null,
		};
	}
	/**
	 *
	 * @param {string} name
	 */
	constructor(name, optional = false) {
		this.name = name;
		this.optional = optional;
	}
}

export const ArgumentTypes = {
	string: StringArgumentType,
	int: IntegerArgumentType,
	float: FloatArgumentType,
	location: LocationArgumentType,
	boolean: BooleanArgumentType,
	player: PlayerArgumentType,
	target: TargetArgumentType,
	array: ArrayArgumentType,
	unit: UnitArgumentType,
};
