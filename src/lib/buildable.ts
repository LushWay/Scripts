// Experimental solution
// Pros:
// - more readable code
// - less boilerplate
//
// Cons:
// - no "Go to" definitions
// - no renaming using F2
// - no docs
// - function properties and getters still pop up as required (fixable bug)

export class Buildable {
  static Build<T extends AnyClass>(this: T, ...params: ConstructorParameters<T>) {
    const instance = new this(...params) as InstanceType<T>

    const setter = new Proxy(instance, {
      get(_, p, __) {
        if (p === 'finalize') return instance
        return (v: unknown) => {
          ;(instance as Record<string | symbol | number, unknown>)[p] = v
          return setter
        }
      },
    })

    return setter as RequiredSetters<InstanceType<T>, undefined>
  }
}

type AnyClass = new (...params: unknown[]) => object
type EmptyObject = Record<string, never>
type IfEmptySwitch<T, S> = T extends EmptyObject ? S : T

type RequiredKeys<T> = { [K in keyof T]-?: object extends Pick<T, K> ? never : K }[keyof T]
type OptionalKeys<T> = { [K in keyof T]-?: object extends Pick<T, K> ? K : never }[keyof T]

type RequiredSetters<T, Set> = {
  [K in Exclude<RequiredKeys<T>, Set>]: (
    v: T[K],
  ) => IfEmptySwitch<RequiredSetters<T, Set | K>, OptionalSetters<T, undefined>>
}

type OptionalSetters<T, Set> = {
  [K in Exclude<OptionalKeys<T>, Set>]: (v: T[K]) => OptionalSetters<T, Set | K>
} & {
  finalize: T
}

class Example extends Buildable {
  property: number

  required: string

  something: number

  another: string

  optional?: boolean

  constructor(
    /** Some doc */
    private consparam: string,
  ) {
    super()
  }
}

Example.Build('consparam').property(32).required('sss').something(333).another('string').optional(true).finalize
