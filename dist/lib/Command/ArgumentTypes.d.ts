/**
 * @abstract
 *
 */
export class IArgumentType {
    constructor(name?: string, optional?: boolean);
    /**
     * The return type
     * @type {any}
     */
    type: any;
    /**
     * The name that the help for this command will see
     * @example "string"
     * @example "Location"
     * @example "int"
     * @example "number"
     * @example "UnitType"
     * @type {string}
     */
    typeName: string;
    /**
     * The name this argument is
     * @type {string}
     */
    name: string;
    /**
     * Argument optionality
     * @type {boolean}
     */
    optional: boolean;
    /**
     * Checks if a value matches this argument type, also
     * returns the corridsponding type
     * @param {string} value
     * @returns {import("./types.js").IArgumentReturnData<any>}
     */
    matches(value: string): import("./types.js").IArgumentReturnData<any>;
}
/**
 * @implements {IArgumentType}
 */
export class LiteralArgumentType implements IArgumentType {
    /**
     *
     * @param {string} name
     * @param {boolean} optional
     */
    constructor(name?: string, optional?: boolean);
    /**
     * @type {null}
     */
    type: null;
    typeName: string;
    optional: boolean;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
    };
    name: string;
}
/**
 * @implements {IArgumentType}
 */
export class StringArgumentType implements IArgumentType {
    /**
     *
     * @param {string} name
     * @param {boolean} optional
     */
    constructor(name?: string, optional?: boolean);
    /**
     * @type {string}
     */
    type: string;
    typeName: string;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
        value: string;
    };
    optional: boolean;
    name: string;
}
/**
 * @implements {IArgumentType}
 */
export class IntegerArgumentType implements IArgumentType {
    /**
     *
     * @param {string} name
     * @param {boolean} optional
     */
    constructor(name?: string, optional?: boolean);
    /** @type {number} */
    type: number;
    optional: boolean;
    typeName: string;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
        value: number;
    };
    name: string;
}
/**
 * @implements {IArgumentType}
 */
export class FloatArgumentType implements IArgumentType {
    /**
     *
     * @param {string} name
     * @param {boolean} optional
     */
    constructor(name?: string, optional?: boolean);
    /** @type {number} */
    type: number;
    optional: boolean;
    typeName: string;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
        value: number;
    };
    name: string;
}
/**
 * @implements {IArgumentType}
 */
export class LocationArgumentType implements IArgumentType {
    /**
     *
     * @param {string} name
     * @param {boolean} optional
     */
    constructor(name?: string, optional?: boolean);
    /** @type {Vector3} */
    type: Vector3;
    optional: boolean;
    typeName: string;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
        value: string;
    };
    name: string;
}
/**
 * @implements {IArgumentType}
 */
export class BooleanArgumentType implements IArgumentType {
    constructor(name?: string, optional?: boolean);
    /** @type {boolean} */
    type: boolean;
    optional: boolean;
    typeName: string;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
        value: boolean;
    };
    name: string;
}
/**
 * @implements {IArgumentType}
 */
export class PlayerArgumentType implements IArgumentType {
    constructor(name?: string, optional?: boolean);
    /** @type {Player} */
    type: Player;
    optional: boolean;
    typeName: string;
    /**
     * @param {string} value
     */
    matches(value: string): {
        success: boolean;
        value: Player;
    };
    name: string;
}
/**
 * @implements {IArgumentType}
 */
export class TargetArgumentType implements IArgumentType {
    constructor(name?: string, optional?: boolean);
    /** @type {string} */
    type: string;
    optional: boolean;
    typeName: string;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
        value: string;
    };
    name: string;
}
/**
 * @implements {IArgumentType}
 * @template {ReadonlyArray<string>} T
 */
export class ArrayArgumentType<T extends readonly string[]> implements IArgumentType {
    /**
     *
     * @param {string} name
     * @param {T} types
     * @param {boolean} optional
     */
    constructor(name: string, types: T, optional?: boolean);
    /** @type {T[number]} */
    type: T[number];
    optional: boolean;
    typeName: string;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
        value: string;
    };
    name: string;
    types: T;
}
/**
 * @implements {IArgumentType}
 */
export class UnitArgumentType implements IArgumentType {
    /**
     *
     * @param {string} name
     */
    constructor(name: string, optional?: boolean);
    /** @type {import("./types.js").MSValueType} */
    type: import("./types.js").MSValueType;
    optional: boolean;
    typeName: string;
    /**
     *
     * @param {string} value
     * @returns
     */
    matches(value: string): {
        success: boolean;
        value: string;
    };
    name: string;
}
export namespace ArgumentTypes {
    export { StringArgumentType as string };
    export { IntegerArgumentType as int };
    export { FloatArgumentType as float };
    export { LocationArgumentType as location };
    export { BooleanArgumentType as boolean };
    export { PlayerArgumentType as player };
    export { TargetArgumentType as target };
    export { ArrayArgumentType as array };
    export { UnitArgumentType as unit };
}
import { Player } from "@minecraft/server";
