import { Player } from '@minecraft/server'
import { Command } from './index.js'

export interface CommandMetadata {
  /**
   * The name of the command
   *
   * @example
   *   ban
   */
  name: string
  /**
   * How this command works
   *
   * @example
   *   Bans a player
   */
  description?: string
  /**
   * Other names that can call this command
   *
   * @example
   *   ;```["f", "s"]```
   *
   * @example
   *   ;```["f"]```
   */
  aliases?: string[]
  /**
   * A function that will determine if a player has permission to use this command
   *
   * @example
   *   ;```
   *   (player) => player.hasTag("admin")
   *   ```
   *
   * @param player This will return the player that uses this command
   * @returns If this player has permission to use this command
   */
  requires?: (player: Player) => boolean

  /** Specify this to generate `requires: (p) => IS(player, require)` */
  role?: Role
  /**
   * The message that will be send if a player doest have permission to use this command Its good to explain why this
   * failed here
   *
   * @example
   *   You can only run this command in the overworld
   *
   * @example
   *   You are not a admin
   *
   * @example
   *   You have failed to meet the required paramaters for this command
   */
  invaildPermission?: string
  /** @type {'test' | 'we' | 'public'} */
  type?: string
}

type AppendArgument<Base, Next> = Base extends (ctx: infer X, ...args: infer E) => infer R
  ? (ctx: X, ...args: [...E, Next]) => R
  : never

export type ArgReturn<Callback, Type> = Command<AppendArgument<Callback, Type>>

export interface MatchesArgumentReturn<T> {
  /** If this argument matches the value */
  success: boolean
  /** The parsed value that should be passed in command callback if there is no return type this will be null */
  value?: T
}
