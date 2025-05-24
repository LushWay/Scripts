// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export abstract class IArgumentType<T extends boolean = false> {
  /** The return type */
  abstract type: unknown

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
  abstract typeName: string

  /** The name this argument is */
  abstract name: string

  /** Argument optionality */
  abstract optional: T

  /** Checks if a value matches this argument type, also returns the corridsponding type */
  abstract matches(value: string): {
    success: boolean
    value?: unknown
  }

  toString() {
    const { name, typeName, optional } = this
    return optional ? `§7[${name}§r§7: ${typeName}§7]` : `§6<${name}§r§6: ${typeName}§6>`
  }
}

export class LiteralArgumentType<T extends boolean = false> extends IArgumentType<T> {
  constructor(
    public name = 'literal',
    public optional: T = false as T,
  ) {
    super()
  }

  type = null

  typeName = 'literal'

  matches(value: string) {
    return {
      success: this.name === value,
    }
  }

  toString(): string {
    return `${this.optional ? '§7' : '§f'}${this.name}`
  }
}

export class StringArgumentType<T extends boolean = false> extends IArgumentType<T> {
  constructor(
    public name = 'string',
    public optional: T = false as T,
  ) {
    super()
  }

  type = 'string'

  typeName = '§3string'

  matches(value: string) {
    return {
      success: !!value,
      value: value,
    }
  }
}

export class IntegerArgumentType<T extends boolean = false> extends IArgumentType<T> {
  constructor(
    public name = 'integer',
    public optional: T = false as T,
  ) {
    super()
  }

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

export class LocationArgumentType<T extends boolean = false> extends IArgumentType<T> {
  constructor(
    public name = 'location',
    public optional: T = false as T,
  ) {
    super()
  }

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

export class BooleanArgumentType<T extends boolean = false> extends IArgumentType<T> {
  constructor(
    public name = 'boolean',
    public optional: T = false as T,
  ) {
    super()
  }

  type = false as boolean

  typeName = 'boolean'

  matches(value: string) {
    return {
      success: /^(true|false)$/g.test(value),
      value: typeof value === 'undefined' ? undefined : value == 'true' ? true : false,
    }
  }
}

export class ArrayArgumentType<const T extends string[], B extends boolean = false> extends IArgumentType<B> {
  constructor(
    public name = 'array',
    public types: T,
    public optional: B = false as B,
  ) {
    super()
    this.typeName = types.join(' | ').replace(/(.{25})..+/, '$1...')
  }

  type = this.types[0] as T[number]

  typeName = 'string'

  matches(value: string) {
    return {
      success: this.types.includes(value),
      value: value,
    }
  }
}
