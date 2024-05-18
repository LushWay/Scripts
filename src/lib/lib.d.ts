import * as mc from '@minecraft/server'
import '../../tools/definedGlobals'

type JsonPrimative = string | number | boolean | null
type JsonArray = Json[]
type JsonComposite = JsonArray | JsonObject
type Json = JsonPrimative | JsonComposite

declare global {
  type VoidFunction = () => void

  type Vector3 = mc.Vector3
  type Vector2 = mc.Vector2
  type VectorXZ = Record<'x' | 'z', number>
  type Vector5 = Record<'x' | 'y' | 'z' | 'rx' | 'ry', number>

  type Dimensions = mc.ShortcutDimensions

  /** Represents JSON-compatible object type */
  // eslint-disable-next-line
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
        // eslint-disable-next-line @typescript-eslint/ban-types
        [K in keyof T]: T[K] extends Function ? T[K] : Narrow<T[K]>
      }

  // Vite compability
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface WebSocket {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Worker {}
}

/** Describes types that can be narrowed */
type Narrowable = string | number | bigint | boolean

declare module '@minecraft/server' {
  interface PlayerDatabase {
    name?: string | undefined
    readonly role: Role
    prevRole?: Role
    quests?: import('../modules/quests/lib/quest').QuestDB
    join?: {
      position?: number[]
      stage?: number
    }
  }
}

export {}
