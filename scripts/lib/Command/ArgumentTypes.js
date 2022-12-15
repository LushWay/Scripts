import { Player, world } from "@minecraft/server";

/**
 * Fetch an online players data
 * @param {string} playerName
 * @returns {Player | null}
 */
export function fetch(playerName) {
	return [...world.getPlayers()].find((plr) => plr.name === playerName);
}

export class LiteralArgumentType {
	typeName = "literal";
	optional;
	matches(value) {
		return {
			success: this.name == value,
		};
	}
	constructor(name = "literal", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class StringArgumentType {
	typeName = "string";
	matches(value) {
		return {
			success: value && value !== "",
			value: value,
		};
	}

	constructor(name = "string", optional) {
		this.optional = optional;
		this.name = name;
	}
}

/** @type {import("./ArgumentTypes.js").IntegerArgumentType} */
export class IntegerArgumentType {
	typeName = "int";
	matches(value) {
		return {
			success: !isNaN(value),
			value: parseInt(value),
		};
	}

	constructor(name = "integer", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class FloatArgumentType {
	typeName = "float";
	matches(value) {
		return {
			success: Boolean(value?.match(/^\d+\.\d+$/)?.[0]),
			value: parseInt(value),
		};
	}

	constructor(name = "float", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class LocationArgumentType {
	typeName = "location";
	matches(value) {
		const res = /^([~^]?-?\d+)|([~^])$/g.test(value);

		return {
			success: res,
			value: value,
		};
	}

	constructor(name = "location", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class BooleanArgumentType {
	typeName = "boolean";
	matches(value) {
		return {
			success: /^(true|false)$/g.test(value),
			value: value == "true" ? true : false,
		};
	}

	constructor(name = "boolean", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class PlayerArgumentType {
	typeName = "playerName";
	matches(value) {
		const p = fetch(value);
		return {
			success: p ? true : false,
			value: p,
		};
	}

	constructor(name = "player", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class TargetArgumentType {
	typeName = "Target";
	matches(value) {
		return {
			success: Boolean(value?.match(/^(@.+|"[^"]+")$/)?.[0]),
			value: value,
		};
	}

	constructor(name = "target", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class ArrayArgumentType {
	typeName = "string";
	matches(value) {
		return {
			success: this.types.includes(value),
			value: value,
		};
	}

	constructor(name = "array", types, optional) {
		this.optional = optional;
		this.name = name;
		this.types = types;

		this.typeName = types.join(" | ").replace(/(.{25})..+/, "$1...");
	}
}

export class UnitArgumentType {
	typeName = "UnitValueType";
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
	constructor(_name, optional) {
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
