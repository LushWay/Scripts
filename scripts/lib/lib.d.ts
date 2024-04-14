import * as mc from '@minecraft/server'
import { ItemLockMode, ItemStack } from '@minecraft/server'
import { SimulatedPlayer } from '@minecraft/server-gametest'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { SOUNDS } from 'config'
import { ROLES } from 'lib'
import { MinecraftEnchantmentTypes } from 'lib/Assets/enchantments'

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

  interface ArrayConstructor {
    /**
     * Checks if two arrays are the same
     * @param one
     * @param two
     */
    equals(one: any[], two: any[]): boolean
  }

  interface Function {
    bind<Fn extends (...args: unknown[]) => unknown>(this: Fn, context: object, args: any): Fn
  }

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

  type Percent = `${number}%`

  type PartialParts<B, ThisArg = B> = {
    [P in keyof B]?: B[P] extends (...param: infer param) => infer ret ? (this: ThisArg, ...param: param) => ret : B[P]
  }

  /**
   * @remarks нет кого/чего, вижу кого/что, где
   * @remarks базы, базу, на базе
   * @remarks региона, региону, в регионе
   */
  type WordPluralForms = [one: string, more: string, aa: string]

  type McText = (mc.RawMessage | string)[] | mc.RawMessage | string

  // https://github.com/Microsoft/TypeScript/issues/13923#issuecomment-653675557
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
}

declare module '@minecraft/server' {
  interface PlayerDatabase {
    name?: string | undefined
    readonly role: Role
    prevRole?: Role
    quests?: import('./Quest').QuestDB
    join?: {
      position?: number[]
      stage?: number
    }
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
    /**
     * Whenether player is simulated or not
     */
    isSimulated(): this is SimulatedPlayer

    scores: Record<ScoreName, number>
    database: PlayerDatabase

    /**
     * Sends message prefixed with
     * ```js
     * '§4§l> §r§c'
     * ```
     * and plays {@link SOUNDS}.fail
     *
     * Other message types: warn success info
     */
    fail(message: string): void
    /**
     * Sends message prefixed with
     * ```js
     * '§l§e⚠ §6'
     * ```
     * and plays {@link SOUNDS}.fail
     *
     * Other message types: **fail success info**
     */
    warn(message: string): void
    /**
     * Sends message prefixed with
     * ```js
     * '§a§l> §r'
     * ```
     * and plays {@link SOUNDS}.success
     *
     * Other message types: **fail warn info**
     */
    success(message: string): void
    /**
     * Sends message prefixed with
     * ```js
     * '§b§l> §r§3'
     * ```
     * and plays {@link SOUNDS}.action
     *
     * Other message types: **fail warn success**
     */
    info(message: string): void
  }

  interface HudTitleDisplayOptions {
    /**
     * Priority of the displayed information
     */
    priority?: number
  }

  interface ScreenDisplay {
    /**
     * Player attached to this screen display
     */
    player: Player

    /**
     * Sets player title
     * @param text Text to set
     */
    setHudTitle(text: string, options: TitleDisplayOptions & HudTitleDisplayOptions, prefix?: string, n?: number): void
    /**
     * Sets player sidebar
     * @param text Text to set
     * @param priority Priority of the displayed information
     */
    setSidebar(text: string, priority?: number): void

    /**
     * Sets player tip
     * @param n Tip position
     * @param text Tip text
     * @param priority Priority of the displayed information
     */
    setTip(n: 1 | 2 | 3 | 4 | 5, text: string, priority?: number): void
  }

  interface Entity {
    readonly container?: Container
  }

  interface Container {
    entries(): [number, ItemStack | undefined][]
    slotEntries(): [number, ContainerSlot][]
  }
}

/**
 * Describes types that can be narrowed
 */
type Narrowable = string | number | bigint | boolean

declare global {
  /**
   * Narrows type. Source: ts-toolbelt
   */
  type Narrow<T> =
    | (T extends [] ? [] : never)
    | (T extends Narrowable ? T : never)
    | {
        // eslint-disable-next-line @typescript-eslint/ban-types
        [K in keyof T]: T[K] extends Function ? T[K] : Narrow<T[K]>
      }

  namespace LootItem {
    interface Common {
      /**
       * - Amount of the item
       * @default 1
       */
      amount?: RandomCostMapType | number
      /**
       * - Cost of the item. Items with higher cost will be generated more often
       */
      chance: Percent

      /**
       * - Map in format { enchant: { level: percent } }
       */
      enchantments?: Partial<Record<keyof typeof MinecraftEnchantmentTypes, RandomCostMapType>>
      /**
       * - Damage of the item
       */
      damage?: RandomCostMapType

      /**
       * - Additional options for the item like canPlaceOn, canDestroy, nameTag etc
       */
      options?: Options
    }

    interface Options {
      lore?: string[]
      nameTag?: string
      keepOnDeath?: boolean
      canPlaceOn?: string[]
      canDestroy?: string[]
      lockMode?: ItemLockMode
    }

    interface TypeIdInput {
      /**
       * - Stringified id of the item. May include namespace (e.g. "minecraft:").
       */
      typeId: string
    }

    interface TypeInput {
      /**
       * - Item type name. Its key of MinecraftItemTypes.
       */
      type: Exclude<keyof typeof MinecraftItemTypes, 'prototype' | 'string'>
    }

    interface ItemStackInput {
      /**
       * - Item stack. Will be cloned.
       */
      itemStack: ItemStack
    }

    type Input = (TypeIdInput | TypeInput | ItemStackInput) & Common

    type Stored = {
      itemStack: ItemStack
      enchantments: Record<string, number[]>
      chance: number
      amount: number[]
      damage: number[]
    }
  }
}

export {}
