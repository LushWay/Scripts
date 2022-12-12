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
	type;
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
	type;
	typeName = "string";
	matches(value) {
		return {
			success: value && value != "",
			value: value,
		};
	}

	constructor(name = "string", optional) {
		this.optional = optional;
		this.name = name;
	}
}

/** @type {import("./ArgumentTypes.js").IArgumentType} */
export class IntegerArgumentType {
	type;
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
	type;
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
	type;
	typeName = "location";
	matches(value) {
		return {
			success: !isNaN(value),
			value: value,
		};
	}

	constructor(name = "location", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class BooleanArgumentType {
	type;
	typeName = "boolean";
	matches(value) {
		return {
			success: Boolean(value?.match(/^(true|false)$/)?.[0]),
			value: value == "true" ? true : false,
		};
	}

	constructor(name = "boolean", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class PlayerArgumentType {
	type;
	typeName = "playerName";
	matches(value) {
		return {
			success: fetch(value) ? true : false,
			value: fetch(value),
		};
	}

	constructor(name = "player", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class TargetArgumentType {
	type;
	typeName = "Target";
	matches(value) {
		return {
			success: Boolean(value?.match(/^(@.|"[\s\S]+")$/)?.[0]),
			value: value,
		};
	}

	constructor(name = "target", optional) {
		this.optional = optional;
		this.name = name;
	}
}

export class ArrayArgumentType {
	type;
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
	type;
	typeName = "UnitValueType";
	matches(value) {
		if (
			![
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
			].includes(value)
		)
			return {
				success: false,
			};
		return {
			success: value && value != "",
			value: value,
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
