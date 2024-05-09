import * as mc from '@minecraft/server'

type JsonPrimative = string | number | boolean | null
type JsonArray = Json[]
type JsonComposite = JsonArray | JsonObject
type Json = JsonPrimative | JsonComposite

declare global {
  // Global variables injected via esbuild

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __DEV__: boolean
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __PRODUCTION__: boolean
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __SERVER__: boolean
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __TEST__: boolean
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __RELEASE__: boolean

  type VoidFunction = () => void

  type Vector3 = mc.Vector3
  type Vector2 = mc.Vector2
  type VectorXZ = { x: number; z: number }
  type Vector5 = { x: number; y: number; z: number; rx: number; ry: number }

  type Dimensions = mc.ShortcutDimensions

  /** Represents JSON-compatible object type */
  type JSONLike = Record<string | symbol | number, any>
  type JsonObject = { [key: string]: Json }

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

  /** Text that can be displayed on player screen and should support translation */
  type Text = (mc.RawMessage | string)[] | mc.RawMessage | string

  // Custom immutable type
  // source: https://github.com/Microsoft/TypeScript/issues/13923#issuecomment-653675557
  export type Immutable<T> =
    // eslint-disable-next-line @typescript-eslint/ban-types
    T extends Function | boolean | number | string | null | undefined
      ? T
      : T extends Array<infer U>
        ? ReadonlyArray<Immutable<U>>
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
        // eslint-disable-next-line @typescript-eslint/ban-types
        [K in keyof T]: T[K] extends Function ? T[K] : Narrow<T[K]>
      }
}

/** Describes types that can be narrowed */
type Narrowable = string | number | bigint | boolean

declare module '@minecraft/server' {
  interface PlayerDatabase {
    name?: string | undefined
    readonly role: Role
    prevRole?: Role
    quests?: import('../modules/Quests/lib/Quest').QuestDB
    join?: {
      position?: number[]
      stage?: number
    }
  }
}

export {}
