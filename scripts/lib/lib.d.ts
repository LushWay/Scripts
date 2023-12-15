import * as mc from '@minecraft/server'
import { ROLES } from './roles'
declare global {
  type VoidFunction = () => void

  interface Console {
    error(...data: any[]): void
    info(...data: any[]): void
    log(...data: any[]): void
    warn(...data: any[]): void
    debug(...data: any[]): void
    verbose(...data: any[]): void
  }

  let console: Console
  let nextTick: Promise<void>
  let verbose: boolean

  interface JSON {
    /**
     * Parses string and catches any error. If callback param is specified, it will be called with catched error. For more info see {@link JSON.parse}
     */
    safeParse(
      text: string,
      reciever?: (this: any, key: string, value: any) => any,
      errorCallback?: (error: Error) => any
    ): any
  }

  interface ArrayConstructor {
    /**
     * Checks if two arrays are the same
     * @param one
     * @param two
     */
    equals(one: any[], two: any[]): boolean
  }

  // interface Function {
  //   bind<Fn extends (...args: unknown[]) => unknown>(this: Fn, context: object, args: any): Fn
  // }

  interface Array<T> {
    /**
     * Returns random array element. Alias to
     * ```js
     * array[Math.randomInt(0, array.length - 1)]
     * ```
     */
    randomElement(): T
  }

  interface Math {
    randomInt(minimum: number, maximum: number): number
    randomFloat(minimum: number, maximum: number): number
  }

  interface ObjectConstructor {
    entriesStringKeys<O extends Record<string, any>>(o: O): [keyof O, O[keyof O]][]
    fromEntries<V = any, K extends string = string>(entries: Iterable<readonly [K, V]>): Record<K, V>

    keys<T extends Record<string, any>>(o: T): (keyof T extends string ? keyof T : never)[]
  }

  type Vector3 = mc.Vector3
  type Vector2 = mc.Vector2
  type Point = { x: number; z: number }
  type Dimensions = mc.ShortcutDimensions

  type JSONLike = Record<string | symbol | number, any>

  type RandomCostMapType = {
    [key: `${number}...${number}` | number]: Percent
  }

  type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>> | T

  type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>

  type Percent = `${number}%`

  type PlayerDB<Value = any> = { save(): void; data: Value }

  type PartialParts<B, ThisArg = B> = {
    [P in keyof B]?: B[P] extends (...param: infer param) => infer ret ? (this: ThisArg, ...param: param) => ret : B[P]
  }

  /**
   * @remarks нет кого/чего, дам кому/чему, где
   * @remarks базы, базу, на базе
   * @remarks региона, региону, в регионе
   */
  type WordPluralForms = [one: string, more: string, aa: string]
}

declare module '@minecraft/server' {
  interface PlayerDatabase {
    role: keyof typeof ROLES
    quest?: import('./Class/Quest').QuestDB
  }

  type ScoreNames = 'money' | 'leafs' | 'pvp' | 'joinDate' | 'joinTimes'
  interface Player {
    scores: Record<ScoreNames, number>
    database: PlayerDatabase
  }

  interface Container {
    entries(): [number, ItemStack | undefined][]
  }
}
