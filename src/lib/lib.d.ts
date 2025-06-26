import * as mc from '@minecraft/server'
import '../../tools/defines'

declare global {
  type VoidFunction = () => void

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  type Vector3 = { x: number; y: number; z: number }
  type Vector2 = mc.Vector2
  type VectorXZ = Record<'x' | 'z', number>
  type Vector5 = Record<'x' | 'y' | 'z' | 'rx' | 'ry', number>

  type DimensionType = mc.ShortcutDimensions

  /** Represents JSON-compatible primitive type */
  type JsonPrimative = string | number | boolean | null | undefined

  /** Represents JSON-compatible object type */
  // eslint-disable-next-line
  type JsonObject = { [key: string]: Json }

  /** Represents JSON-compatible object or primitive type */
  type Json = JsonPrimative | JsonArray | JsonObject

  /** Represents JSON-compatible array type */
  type JsonArray = Json[]

  type PartialParts<B, ThisArg = B> = {
    [P in keyof B]?: B[P] extends (...param: infer param) => infer ret ? (this: ThisArg, ...param: param) => ret : B[P]
  }

  type PlayerCallback = (player: mc.Player) => void

  /**
   * @remarks
   *   Нет кого/чего, вижу кого/что, где
   * @remarks
   *   Базы, базу, на базе
   * @remarks
   *   Региона, региону, в регионе
   */
  type WordPluralForms = [one: string, more: string, aa: string]

  type ValueOf<T> = T[keyof T]

  type MaybePromise<T> = T | Promise<T>

  // Custom immutable type
  // source: https://github.com/Microsoft/TypeScript/issues/13923#issuecomment-653675557
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  export type Immutable<T> = T extends Function | boolean | number | string | null | undefined
    ? T
    : T extends (infer U)[]
      ? readonly Immutable<U>[]
      : T extends Map<infer K, infer V>
        ? ReadonlyMap<Immutable<K>, Immutable<V>>
        : T extends Set<infer S>
          ? ReadonlySet<Immutable<S>>
          : { readonly [P in keyof T]: Immutable<T[P]> }

  /** Narrows type. source: ts-toolbelt npm package */
  type Narrow<T> =
    | (T extends [] ? [] : never)
    | (T extends Narrowable ? T : never)
    | {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        [K in keyof T]: T[K] extends Function ? T[K] : Narrow<T[K]>
      }

  // Vite compability
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface WebSocket {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Worker {}

  // I hate eslint btw
  interface PromiseWithResolvers<T> {
    promise: Promise<T>
    resolve: (value: T | PromiseLike<T>) => void
    reject: (reason?: any) => void
  }

  interface PromiseConstructor {
    withResolvers<T>(): PromiseWithResolvers<T>
  }
}

/** Describes types that can be narrowed */
type Narrowable = string | number | bigint | boolean

declare module '@minecraft/server' {
  interface PlayerDatabase {
    name?: string | undefined
    readonly role: Role
    prevRole?: Role
    quests?: import('./quest/quest').Quest.DB
    achivs?: import('./achievements/achievement').Achievement.DB
    join?: {
      position?: number[]
      stage?: number
    }
    unlockedPortals?: string[]
  }
}

export {}
