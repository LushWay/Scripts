import { Player, world } from "@minecraft/server";
/**
 * @abstract
 *
 */
export class IArgumentType {
    /**
     * Checks if a value matches this argument type, also
     * returns the corridsponding type
     * @param {string} value
     * @returns {import("./types.js").IArgumentReturnData<any>}
     */
    matches(value) {
        return;
    }
    constructor(name = "any", optional = false) {
        /**
         * The name this argument is
         * @type {string}
         */
        this.name = "name";
        /**
         * Argument optionality
         * @type {boolean}
         */
        this.optional = false;
    }
}
/**
 * @implements {IArgumentType}
 */
export class LiteralArgumentType {
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
        this.typeName = "literal";
        this.optional = optional;
        this.name = name;
    }
}
/**
 * @implements {IArgumentType}
 */
export class StringArgumentType {
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value) {
        return {
            success: value && value !== "",
            value: value,
        };
    }
    /**
     *
     * @param {string} name
     * @param {boolean} optional
     */
    constructor(name = "string", optional = false) {
        this.typeName = "§3string";
        this.optional = optional;
        this.name = name;
    }
}
/**
 * @implements {IArgumentType}
 */
export class IntegerArgumentType {
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
        this.typeName = "int";
        this.optional = optional;
        this.name = name;
    }
}
/**
 * @implements {IArgumentType}
 */
export class FloatArgumentType {
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
        this.typeName = "float";
        this.optional = optional;
        this.name = name;
    }
}
/**
 * @implements {IArgumentType}
 */
export class LocationArgumentType {
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
        this.typeName = "location";
        this.optional = optional;
        this.name = name;
    }
}
/**
 * @implements {IArgumentType}
 */
export class BooleanArgumentType {
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
        this.typeName = "boolean";
        this.optional = optional;
        this.name = name;
    }
}
/**
 * @implements {IArgumentType}
 */
export class PlayerArgumentType {
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
        this.typeName = "playerName";
        this.optional = optional;
        this.name = name;
    }
}
/**
 * @implements {IArgumentType}
 */
export class TargetArgumentType {
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
        this.typeName = "Target";
        this.optional = optional;
        this.name = name;
    }
}
/**
 * @implements {IArgumentType}
 * @template {ReadonlyArray<string>} T
 */
export class ArrayArgumentType {
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
        this.typeName = "string";
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
        this.typeName = "UnitValueType";
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
