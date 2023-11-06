/**
 * @abstract
 *
 */
export class IArgumentType {
  /**
   * The return type
   * @type {any}
   */
  type
  /**
   * The name that the help for this command will see
   * @example "string"
   * @example "Location"
   * @example "int"
   * @example "number"
   * @example "UnitType"
   * @type {string}
   */
  typeName
  /**
   * The name this argument is
   * @type {string}
   */
  name = 'name'
  /**
   * Argument optionality
   * @type {boolean}
   */
  optional = false
  /**
   * Checks if a value matches this argument type, also
   * returns the corridsponding type
   * @param {string} value
   * @returns {import("./types.js").IArgumentReturnData<any>}
   */
  matches(value) {
    return {
      success: false,
    }
  }
  constructor(name = 'any', optional = false) {}
}

/**
 * @implements {IArgumentType}
 */
export class LiteralArgumentType {
  /**
   * @type {null}
   */
  type
  typeName = 'literal'
  optional
  /**
   *
   * @param {string} value
   * @returns
   */
  matches(value) {
    return {
      success: this.name === value,
    }
  }
  /**
   *
   * @param {string} name
   * @param {boolean} optional
   */
  constructor(name = 'literal', optional = false) {
    this.optional = optional
    this.name = name
  }
}

/**
 * @implements {IArgumentType}
 */
export class StringArgumentType {
  /**
   * @type {string}
   */
  type
  typeName = '§3string'
  /**
   *
   * @param {string} value
   * @returns
   */
  matches(value) {
    return {
      success: !!value,
      value: value,
    }
  }
  /**
   *
   * @param {string} name
   * @param {boolean} optional
   */
  constructor(name = 'string', optional = false) {
    this.optional = optional
    this.name = name
  }
}

/**
 * @implements {IArgumentType}
 */
export class IntegerArgumentType {
  /** @type {number} */
  type
  optional
  typeName = 'int'
  /**
   *
   * @param {string} value
   * @returns
   */
  matches(value) {
    const val = parseInt(value)
    return {
      success: !isNaN(val),
      value: val,
    }
  }
  /**
   *
   * @param {string} name
   * @param {boolean} optional
   */
  constructor(name = 'integer', optional = false) {
    this.optional = optional
    this.name = name
  }
}

/**
 * @implements {IArgumentType}
 */
export class LocationArgumentType {
  /** @type {Vector3} */
  type
  optional
  typeName = 'location'
  /**
   *
   * @param {string} value
   * @returns
   */
  matches(value) {
    const result = /^(([~^]?-?\d+)|(~|\^))$/g.test(value)

    return {
      success: result,
      value: value,
    }
  }
  /**
   *
   * @param {string} name
   * @param {boolean} optional
   */
  constructor(name = 'location', optional = false) {
    this.optional = optional
    this.name = name
  }
}

/**
 * @implements {IArgumentType}
 */
export class BooleanArgumentType {
  /** @type {boolean} */
  type
  optional
  typeName = 'boolean'
  /**
   *
   * @param {string} value
   * @returns
   */
  matches(value) {
    return {
      success: /^(true|false)$/g.test(value),
      value: value == 'true' ? true : false,
    }
  }

  constructor(name = 'boolean', optional = false) {
    this.optional = optional
    this.name = name
  }
}

/**
 * @implements {IArgumentType}
 * @template {ReadonlyArray<string>} T
 */
export class ArrayArgumentType {
  /** @type {T[number]} */
  type
  optional
  typeName = 'string'
  /**
   *
   * @param {string} value
   * @returns
   */
  matches(value) {
    return {
      success: this.types.includes(value),
      value: value,
    }
  }
  /**
   *
   * @param {string} name
   * @param {T} types
   * @param {boolean} optional
   */
  constructor(name = 'array', types, optional = false) {
    this.optional = optional
    this.name = name
    this.types = types

    this.typeName = types.join(' | ').replace(/(.{25})..+/, '$1...')
  }
}
