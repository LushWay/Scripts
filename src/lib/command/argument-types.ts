export interface IArgumentType {
  /** The return type */
  type: unknown

  /**
   * The name that the help for this command will see
   *
   * @example
   *   string
   *
   * @example
   *   Location
   *
   * @example
   *   int
   *
   * @example
   *   number
   */
  typeName: string

  /** The name this argument is */
  name: string

  /** Argument optionality */
  optional: boolean

  /** Checks if a value matches this argument type, also returns the corridsponding type */
  matches(value: string): {
    success: boolean
    value?: unknown
  }
}

export class LiteralArgumentType implements IArgumentType {
  constructor(
    public name: string = 'literal',
    public optional: boolean = false,
  ) {}

  type: null

  typeName = 'literal'

  matches(value: string) {
    return {
      success: this.name === value,
    }
  }
}

export class StringArgumentType implements IArgumentType {
  constructor(
    public name: string = 'string',
    public optional: boolean = false,
  ) {}

  type: string

  typeName = '§3string'

  matches(value: string) {
    return {
      success: !!value,
      value: value,
    }
  }
}

export class IntegerArgumentType implements IArgumentType {
  constructor(
    public name: string = 'integer',
    public optional: boolean = false,
  ) {}

  type: number

  typeName = 'int'

  matches(value: string) {
    const val = parseInt(value)
    return {
      success: !isNaN(val),
      value: val,
    }
  }
}

export class LocationArgumentType implements IArgumentType {
  constructor(
    public name: string = 'location',
    public optional: boolean = false,
  ) {}

  type: Vector3

  typeName = 'location'

  matches(value: string) {
    const result = /^(([~^]?-?\d+)|(~|\^))$/g.test(value)

    return {
      success: result,
      value: value,
    }
  }
}

export class BooleanArgumentType implements IArgumentType {
  constructor(
    public name = 'boolean',
    public optional = false,
  ) {}

  type: boolean

  typeName = 'boolean'

  matches(value: string) {
    return {
      success: /^(true|false)$/g.test(value),
      value: value == 'true' ? true : false,
    }
  }
}

export class ArrayArgumentType<T extends ReadonlyArray<string>> implements IArgumentType {
  constructor(
    public name: string = 'array',
    public types: T,
    public optional: boolean = false,
  ) {
    this.typeName = types.join(' | ').replace(/(.{25})..+/, '$1...')
  }

  type: T[number]

  typeName = 'string'

  matches(value: string) {
    return {
      success: this.types.includes(value),
      value: value,
    }
  }
}
