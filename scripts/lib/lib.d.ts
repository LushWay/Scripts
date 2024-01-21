import * as mc from '@minecraft/server'
import { ROLES } from 'smapi'
declare global {
  type Role = keyof typeof ROLES
  type VoidFunction = () => void

  interface Date {
    /**
     * Converts date to format
     * DD-MM-YYYY HH:MM:SS
     * @param seconds Adds :SS to format
     */
    format(seconds?: boolean): string
    /**
     * Converts date to format
     * DD-MM-YYYY
     */
    toYYYYMMDD(): string
    /**
     * Converts date to format
     * HH:MM
     * @param seconds Adds :SS to format
     */
    toHHMM(seconds?: boolean): string
  }

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
    role: Role
    quest?: import('./Class/Quest').QuestDB
  }

  type GameplayStatScoreName =
    | 'blocksPlaced'
    | 'blocksBroke'
    | 'fireworksLaunched'
    | 'fireworksExpoded'
    | 'damageRecieve'
    | 'damageGive'
    | 'kills'
    | 'deaths'

  type TimeStatScoreName = `${'total' | 'anarchy'}OnlineTime`

  type DateStatScoreName = `${'lastSeen' | 'join'}Date`

  type StatScoreName = GameplayStatScoreName | TimeStatScoreName | DateStatScoreName

  type ScoreName = 'money' | 'leafs' | 'pvp' | 'joinTimes' | StatScoreName

  interface Player {
    scores: Record<ScoreName, number>
    database: PlayerDatabase

    // TODO Migrate all code to those methods
    /**
     * Sends message prefixed with §4> §c
     * and plays SOUNDS.fail
     */
    fail(message: string): void
    /**
     * Sends message prefixed with §e> §f
     * and plays SOUNDS.fail
     */
    warn(message: string): void
    /**
     * Sends message prefixed with §a> §f
     * and plays SOUNDS.success
     */
    success(message: string): void
    /**
     * Sends message prefixed with §b> §3
     * and plays SOUNDS.action
     */
    info(message: string): void
  }

  interface ScreenDisplay {
    // TODO Add priorities
    /**
     * Sets player sidebar
     * @param text Text to set
     */
    setSidebar(text: string): void

    /**
     * Sets player tip
     * @param n Tip position
     * @param text Tip text
     */
    setTip(n: 1 | 2 | 3 | 4 | 5, text: string): void
  }

  interface Entity {
    readonly container?: Container
  }

  interface Container {
    entries(): [number, ItemStack | undefined][]
  }
}
