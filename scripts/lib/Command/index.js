import { ChatSendAfterEvent, Player, world } from '@minecraft/server'
import { CONFIG } from '../Assets/config.js'
import { is } from '../roles.js'
import {
  ArrayArgumentType,
  BooleanArgumentType,
  IArgumentType,
  IntegerArgumentType,
  LiteralArgumentType,
  LocationArgumentType,
  StringArgumentType,
} from './ArgumentTypes.js'
import { CmdLet } from './Cmdlet.js'
import { CommandContext } from './Context.js'
import './index.js'
import { commandNoPermissions, commandNotFound, commandSyntaxFail, parseCommand, sendCallback } from './utils.js'

/**
 * @template Base
 * @template Next
 * @typedef {Base extends (ctx: infer X, ...args: infer E) => infer R ? (ctx: X, ...args: [...E, Next]) => R : never} AppendArgument
 */

/**
 * @template Callback
 * @template Type
 * @typedef {Command<AppendArgument<Callback, Type>>} ArgReturn
 */

/**
 * @template {(ctx: CommandContext, ...args: any) => unknown} [Callback=(ctx: CommandContext) => unknown] Default is
 *   `(ctx: CommandContext) => unknown`
 */
export class Command {
  /** @param {string} message */
  static isCommand(message) {
    return CONFIG.commandPrefixes.some(prefix => message.startsWith(prefix) && message !== prefix)
  }

  /** @param {ChatSendAfterEvent} event */
  static chatListener(event) {
    if (!this.isCommand(event.message)) return

    const parsed = parseCommand(event.message, 1)
    if (!parsed) {
      console.error(`Unable to parse command '${event.message}', user: '${event.sender.name}§r'`)
      return event.sender.fail('Не удалось обработать команду.')
    }

    const { cmd, args, input } = parsed
    const command = Command.commands.find(c => c.sys.name === cmd || c.sys.aliases?.includes(cmd))
    if (!command) return commandNotFound(event.sender, cmd)
    if (!command.sys.requires(event.sender)) return commandNoPermissions(event.sender, command)

    if (CmdLet.workWithCmdlets(event, args, command, input) === 'stop') return

    /**
     * Check Args/SubCommands for errors
     *
     * @type {Command[]}
     */
    const childs = []

    /**
     * @param {Command<any>} start
     * @param {number} i
     * @returns {'fail' | 'success'}
     */
    function getChilds(start, i) {
      if (!command) return 'fail'
      if (start.sys.children.length > 0) {
        const child = start.sys.children.find(
          v => v.sys.type.matches(args[i]).success || (!args[i] && v.sys.type.optional),
        )
        if (!child && !args[i] && start.sys.callback) return 'success'
        if (!child) return commandSyntaxFail(event.sender, command, args, i), 'fail'
        if (!child.sys?.requires(event.sender)) return commandNoPermissions(event.sender, child), 'fail'
        childs.push(child)
        return getChilds(child, i + 1)
      }
      return 'success'
    }

    if (getChilds(command, 0) === 'fail') return

    sendCallback(args, childs, event, command, input)
  }

  /**
   * An array of all active commands
   *
   * @type {Command<any>[]}
   */
  static commands = []

  /**
   * @param {Command} command
   * @param {CommandContext} ctx
   */
  static getHelpForCommand(command, ctx) {
    return ctx.error('Генератор справки для команд выключен!')
  }

  sys = {
    /**
     * The name of the command
     *
     * @example
     *   ban
     */
    name: 'command',
    description: '',
    /**
     * A function that will determine if a player has permission to use this command
     *
     * @example
     *   ;```
     *   (player) => player.hasTag("admin")
     *   ```
     *
     * @param {Player} player This will return the player that uses this command
     * @returns If this player has permission to use this command
     */
    requires: player => is(player.id, 'admin'),
    /**
     * Alias to `requires: (p) => is(player, role)`
     *
     * @type {Role}
     */

    role: 'member',
    /**
     * Other names that can call this command
     *
     * @example
     *   ;```["f", "s"]```
     *
     * @example
     *   ;```["f"]```
     *
     * @type {string[]}
     */
    aliases: [],
    /** @type {'test' | 'we' | 'public'} */
    group: 'test',

    /** @type {IArgumentType} */
    type: new LiteralArgumentType('command'),

    /**
     * The Arguments of this command
     *
     * @type {Command<any>[]}
     */
    children: [],

    /**
     * Depth of this command
     *
     * @type {number}
     */
    depth: 0,

    /**
     * Parent command
     *
     * @type {Command | null}
     */
    parent: null,

    /**
     * Function to run when this command is called
     *
     * @type {Callback | null}
     */
    callback: null,
  }

  /**
   * @param {string} name
   * @param {IArgumentType} [type]
   * @param {number} [depth]
   * @param {Command<any> | null} [parent]
   */
  constructor(name, type, depth = 0, parent = null) {
    this.sys.name = name

    if (type) this.sys.type = type
    if (parent) this.sys.parent = parent
    if (depth === 0) Command.commands.push(this)
  }

  /**
   * How this command works
   *
   * @example
   *   Bans a player
   *
   * @param {string} string
   */
  setDescription(string) {
    this.sys.description = string
    return this
  }

  /**
   * Other names that can call this command
   *
   * @example
   *   ```"s", "sc"```
   *
   * @example
   *   ```"f"```
   *
   * @param {...string} aliases
   */
  setAliases(...aliases) {
    this.sys.aliases = aliases
    return this
  }

  /**
   * Sets minimal role that allows player to execute the command Default allowed role is admin.
   *
   * Alias to `requires(p => is(p, role))`
   *
   * @overload
   * @param {Role} role
   * @returns {this}
   */

  /**
   * @overload
   * @param {'everybody'} [arg]
   * @returns {this}
   */

  /**
   * A function that will determine if a player has permission to use this command
   *
   * @example
   *   ```
   *   (player) => is(player, "admin")
   *   ```
   *
   * @overload
   * @param {(player: Player) => boolean} [arg]
   * @returns {this}
   */

  /**
   * A function that will determine if a player has permission to use this command
   *
   * @example
   *   ```
   *   (player) => is(player, "admin")
   *   ```
   *
   * @overload
   * @param {Role | ((player: Player) => boolean) | 'everybody'} [arg]
   * @returns {this}
   */

  /**
   * A function that will determine if a player has permission to use this command
   *
   * @example
   *   ```
   *   (player) => is(player, "admin")
   *   ```
   *
   * @param {Role | ((player: Player) => boolean) | 'everybody'} [arg]
   */
  setPermissions(arg) {
    if (!arg) return this

    if (arg === 'everybody') {
      // Everybody
      this.sys.requires = () => true
    } else if (typeof arg === 'function') {
      // Custom permissions function
      this.sys.requires = arg
    } else {
      // Role
      this.sys.role = arg
      this.sys.requires = p => is(p.id, arg)
    }

    return this
  }

  /**
   * Sets command group to disaply in help command
   *
   * @param {'test' | 'we' | 'public'} group
   */
  setGroup(group) {
    this.sys.group = group
    return this
  }

  /**
   * Adds a new branch to this command of your own type
   *
   * @private
   * @template {IArgumentType} T
   * @param {T} type A special type to be added
   * @returns {ArgReturn<Callback, T['type']>} New branch to this command
   */
  argument(type) {
    const cmd = new Command(this.sys.name, type, this.sys.depth + 1, this)
    cmd.sys.name = this.sys.name
    cmd.sys.description = this.sys.description
    cmd.sys.aliases = this.sys.aliases
    cmd.sys.requires = this.sys.requires
    cmd.sys.role = this.sys.role
    cmd.sys.group = this.sys.group

    this.sys.children.push(cmd)
    // @ts-expect-error This mistype
    return cmd
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param {string} name Name this argument should have
   * @returns New branch to this command
   */
  string(name, optional = false) {
    return this.argument(new StringArgumentType(name, optional))
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param {string} name Name this argument should have
   * @returns New branch to this command
   */
  int(name, optional = false) {
    return this.argument(new IntegerArgumentType(name, optional))
  }

  /**
   * Adds a branch to this command of type string
   *
   * @template {ReadonlyArray<string>} T
   * @param {string} name Name this argument should have
   * @param {T} types
   * @returns {ArgReturn<Callback, T[number]>} New branch to this command
   */
  array(name, types, optional = false) {
    return this.argument(new ArrayArgumentType(name, types, optional))
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param {string} name Name this argument should have
   * @returns New branch to this command
   */
  boolean(name, optional = false) {
    return this.argument(new BooleanArgumentType(name, optional))
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param {string} name Name this argument should have
   * @returns {ArgReturn<Callback, Vector3>} New branch to this command
   */
  location(name, optional = false) {
    const cmd = this.argument(new LocationArgumentType(name, optional))
    if (!name.endsWith('*')) {
      const newArg = cmd.location(name + '_y*', optional).location(name + '_z*', optional)
      // @ts-expect-error This mistype
      return newArg
    }
    return cmd
  }

  /**
   * Adds a subCommand to the command
   *
   * @param {string} name Name this literal should have
   * @returns {Command<Callback>} New branch to this command
   */
  overload(name, optional = false) {
    const cmd = new Command(name, new LiteralArgumentType(name, optional), this.sys.depth + 1, this)
    this.sys.children.push(cmd)
    // @ts-expect-error This mistype
    return cmd
  }

  /**
   * Registers this command and its apendending arguments
   *
   * @param {Callback} callback What to run when this command gets called
   * @returns {Command<Callback>}
   */
  executes(callback) {
    this.sys.callback = callback
    return this
  }
}

globalThis.Command = Command

// TODO! REPLACE WITH PACK ON 1.20.70
world.beforeEvents.chatSend.subscribe(event => {
  event.sendToTargets = true
  event.setTargets([])
})
world.afterEvents.chatSend.subscribe(event => Command.chatListener(event))
