export interface IArgumentType<T extends boolean = false> {
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
  optional: T

  /** Checks if a value matches this argument type, also returns the corridsponding type */
  matches(value: string): {
    success: boolean
    value?: unknown
  }
}

export class LiteralArgumentType<T extends boolean = false> implements IArgumentType<T> {
  constructor(
    public name = 'literal',
    public optional: T = false as T,
  ) {}

  type = null

  typeName = 'literal'

  matches(value: string) {
    return {
      success: this.name === value,
    }
  }
}

export class StringArgumentType<T extends boolean = false> implements IArgumentType<T> {
  constructor(
    public name = 'string',
    public optional: T = false as T,
  ) {}

  type = 'string'

  typeName = '§3string'

  matches(value: string) {
    return {
      success: !!value,
      value: value,
    }
  }
}

export class IntegerArgumentType<T extends boolean = false> implements IArgumentType<T> {
  constructor(
    public name = 'integer',
    public optional: T = false as T,
  ) {}

  type = 1

  typeName = 'int'

  matches(value: string) {
    const n = parseInt(value)
    return {
      success: !isNaN(n),
      value: this.optional && isNaN(n) ? undefined : n,
    }
  }
}

export class LocationArgumentType<T extends boolean = false> implements IArgumentType<T> {
  constructor(
    public name = 'location',
    public optional: T = false as T,
  ) {}

  type = { x: 0, y: 0, z: 0 } as Vector3

  typeName = 'location'

  matches(value: string) {
    const result = /^(([~^]?-?\d+)|(~|\^))$/g.test(value)

    return {
      success: result,
      value: value,
    }
  }
}

export class BooleanArgumentType<T extends boolean = false> implements IArgumentType<T> {
  constructor(
    public name = 'boolean',
    public optional: T = false as T,
  ) {}

  type = false as boolean

  typeName = 'boolean'

  matches(value: string) {
    return {
      success: /^(true|false)$/g.test(value),
      value: typeof value === 'undefined' ? undefined : value == 'true' ? true : false,
    }
  }
}

export class ArrayArgumentType<T extends readonly string[], B extends boolean = false> implements IArgumentType<B> {
  constructor(
    public name = 'array',
    public types: T,
    public optional: B = false as B,
  ) {
    this.typeName = types.join(' | ').replace(/(.{25})..+/, '$1...')
  }

  type: T[number] = this.types[0]

  typeName = 'string'

  matches(value: string) {
    return {
      success: this.types.includes(value),
      value: value,
    }
  }
}
