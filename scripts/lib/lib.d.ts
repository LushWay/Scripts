import * as mc from '@minecraft/server'
import { ItemLockMode, ItemStack } from '@minecraft/server'
import { SimulatedPlayer } from '@minecraft/server-gametest'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { ROLES } from 'lib'
import { SOUNDS } from 'lib/Assets/config'
import { MinecraftEnchantmentTypes } from 'lib/Assets/enchantments'

declare global {
  type Role = keyof typeof ROLES
  type VoidFunction = () => void

  interface Date {
    /**
     * Converts date to format DD-MM-YYYY HH:MM:SS
     *
     * @param seconds Adds :SS to format
     */
    format(seconds?: boolean): string
    /** Converts date to format DD-MM-YYYY */
    toYYYYMMDD(): string
    /**
     * Converts date to format HH:MM
     *
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
     *
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
     *
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
  type VectorXZ = { x: number; z: number }
  type Vector5 = { x: number; y: number; z: number; rx: number; ry: number }

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
   * @remarks
   *   Нет кого/чего, вижу кого/что, где
   * @remarks
   *   Базы, базу, на базе
   * @remarks
   *   Региона, региону, в регионе
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
  namespace Player {
    const database: Record<string, PlayerDatabase>

    /**
     * Searches online player by ID
     *
     * @param id - Player ID
     */
    function getById(id: string): Player | undefined
    /**
     * Searches online player by name
     *
     * @param name - Player name
     */
    function getByName(name: string): Player | undefined

    /** Gets player name from the database by id */
    function name(id: string): string | undefined
  }

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

  type GameplayStatScoreName =
    | 'blocksPlaced'
    | 'blocksBroken'
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

    /** Whenether player is simulated or not */
    isSimulated(): this is SimulatedPlayer

    /**
     * Sends message prefixed with
     *
     * ```js
     * '§4§l> §r§c'
     * ```
     *
     * And plays {@link SOUNDS}.fail
     *
     * Other message types: warn success info
     */
    fail(message: string): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§l§e⚠ §6'
     * ```
     *
     * And plays {@link SOUNDS}.fail
     *
     * Other message types: **fail success info**
     */
    warn(message: string): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§a§l> §r'
     * ```
     *
     * And plays {@link SOUNDS}.success
     *
     * Other message types: **fail warn info**
     */
    success(message: string): void
    /**
     * Sends message prefixed with
     *
     * ```js
     * '§b§l> §r§3'
     * ```
     *
     * And plays {@link SOUNDS}.action
     *
     * Other message types: **fail warn success**
     */
    info(message: string): void

    /** Gets ContainerSlot from the player mainhand */
    mainhand(): ContainerSlot

    /** See {@link Player.sendMessage} */
    tell(message: (RawMessage | string)[] | RawMessage | string): void

    /**
     * Applies a knock-back to a player in the direction they are facing, like dashing forward
     *
     * @author @wuw.sh
     */
    applyDash(target: Player | Entity, horizontalStrength: number, verticalStrength: number): void

    /** Determines player gamemode */
    isGamemode(mode: keyof typeof GameMode): boolean

    /**
     * Turns player into survival, damages (if hp < 1 shows lowHealthMessage), and then returns to previous gamemode
     *
     * @returns True if damaged, false if not and lowHealthMessage was shown
     */
    closeChat(lowHealthMessage?: string): boolean
  }

  interface HudTitleDisplayOptions {
    /** Priority of the displayed information */
    priority?: number
  }

  interface ScreenDisplay {
    /** Player attached to this screen display */
    player: Player

    /**
     * Sets player title
     *
     * @param text Text to set
     */
    setHudTitle(text: string, options: TitleDisplayOptions & HudTitleDisplayOptions, prefix?: string, n?: number): void
    /**
     * Sets player sidebar
     *
     * @param text Text to set
     * @param priority Priority of the displayed information
     */
    setSidebar(text: string, priority?: number): void

    /**
     * Sets player tip
     *
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

  /** Dimension names. Used in {@link Dimension.type} */
  type ShortcutDimensions = 'nether' | 'overworld' | 'end'

  interface Dimension {
    /** Dimension type shortcut ({@link Dimension.id} but without the namespace "minecraft:") */
    type: ShortcutDimensions
  }

  namespace Vector {
    /** Returns size between two vectors */
    function size(a: Vector3, b: Vector3): number

    /** Floors each vector axis using Math.floor */
    function floor(a: Vector3): Vector3
    /**
     * Generates a generator of Vector3 objects between two provided Vector3 objects
     *
     * @param a - Starting Vector3 point
     * @param b - Ending Vector3 point
     * @returns - Generator of Vector3 objects
     */
    function foreach(a: Vector3, b: Vector3): Generator<Vector3, void, unknown>

    /** Checks if vector c is between a and b */
    function between(a: Vector3, b: Vector3, c: Vector3): boolean

    /**
     * Returns string representation of vector ('x y z')
     *
     * @param color Whenether to color vector args or not
     */
    function string(a: Vector3, color?: boolean): string

    /** Returns dot product of two vectors */
    function dot(a: Vector3, b: Vector3): number

    /** Returns whenether vector is valid or not Valid vector don't uses NaN values */
    function valid(a: Vector3): boolean

    /**
     * Alias to
     *
     * ```js
     * ;[Vector.add(a, { x: x, y: y, z: z }), Vector.add(a, { x: -x, y: -y, z: -z })]
     * ```
     *
     * @param x Number to increase vector on x axis.
     * @param y Number to increase vector on y axis. Defaults to x
     * @param z Number to increase vector on z axis. Defaults to x
     */
    function around(a: Vector3, x: number, y?: number, z?: number): [Vector3, Vector3]
  }

  interface World {
    /** See {@link World.sendMessage} */
    say(message: (RawMessage | string)[] | RawMessage | string): void

    /**
     * Logs given message once
     *
     * @param type Type of log
     * @param messages Data to log using world.debug()
     */
    logOnce(type: string, ...messages: any): void

    /** Prints data using world.say() and parses any object to string using toStr method. */
    debug(...data: any): void
    overworld: Dimension
    end: Dimension
    nether: Dimension
  }

  interface ItemStack {
    /** Alias to {@link ItemStack.getComponent}('cooldown') */
    cooldown: ItemCooldownComponent

    /** Alias to {@link ItemStack.getComponent}('enchantments') */
    enchantments: ItemEnchantsComponent

    /** Alias to {@link ItemStack.getComponent}('durability') */
    durability: ItemDurabilityComponent

    /** Alias to {@link ItemStack.getComponent}('food') */
    food: ItemFoodComponent

    /** Checks if one item stack properties are fully equal to another (nameTag and lore) */
    is(another: ItemStack): boolean

    /** Sets nameTag and lore */
    setInfo(nameTag: string, description: string): ItemStack
  }

  interface System {
    /**
     * Runs a set of code on an interval for each player.
     *
     * @param callback Functional code that will run when this interval occurs.
     * @param tickInterval An interval of every N ticks that the callback will be called upon.
     * @returns An opaque handle that can be used with the clearRun method to stop the run of this function on an
     *   interval.
     */
    runPlayerInterval(callback: (player: Player) => void, name: string, tickInterval?: number): number
    /** Same as {@link System.run} except for auto handling errors */
    delay(callback: () => void): void
    /**
     * Returns a promise that resolves after given ticks time
     *
     * @param time Time in ticks
     * @returns Promise that resolves after given ticks time
     */
    sleep(time: number): Promise<void>
  }

  /** Used in {@link Dimension.runCommand} */
  interface CommandOptions {
    showOutput?: boolean
    showError?: boolean
  }
}

/** Describes types that can be narrowed */
type Narrowable = string | number | bigint | boolean

declare global {
  /** Narrows type. Source: ts-toolbelt */
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
       *
       * @default 1
       */
      amount?: RandomCostMapType | number
      /** - Cost of the item. Items with higher cost will be generated more often */
      chance: Percent

      /** - Map in format { enchant: { level: percent } } */
      enchantments?: Partial<Record<keyof typeof MinecraftEnchantmentTypes, RandomCostMapType>>
      /** - Damage of the item */
      damage?: RandomCostMapType

      /** - Additional options for the item like canPlaceOn, canDestroy, nameTag etc */
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
      /** - Stringified id of the item. May include namespace (e.g. "minecraft:"). */
      typeId: string
    }

    interface TypeInput {
      /** - Item type name. Its key of MinecraftItemTypes. */
      type: Exclude<keyof typeof MinecraftItemTypes, 'prototype' | 'string'>
    }

    interface ItemStackInput {
      /** - Item stack. Will be cloned. */
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
