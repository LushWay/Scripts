/* eslint-disable @typescript-eslint/unified-signatures */
import { ChatSendAfterEvent, Player, system, world } from '@minecraft/server'
import { defaultLang, Language } from 'lib/assets/lang'
import { i18n, noI18n } from 'lib/i18n/text'
import { stringifyError } from 'lib/util'
import { stringifySymbol } from 'lib/utils/inspect'
import { createLogger } from 'lib/utils/logger'
import { is } from '../roles'
import {
  ArrayArgumentType,
  BooleanArgumentType,
  IArgumentType,
  IntegerArgumentType,
  LiteralArgumentType,
  LocationArgumentType,
  StringArgumentType,
} from './argument-types'
import { CmdLet } from './cmdlet'
import { CommandContext } from './context'
import './index'
import { commandNoPermissions, commandNotFound, commandSyntaxFail, parseCommand, sendCallback } from './utils'

type AppendArgument<Base, Next> = Base extends (ctx: infer X, ...args: infer E) => infer R
  ? (ctx: X, ...args: [...E, Next]) => R
  : never

type ArgReturn<Callback, Type, Optional> = Command<
  AppendArgument<Callback, Optional extends true ? Type | undefined : Type>
>

type CommandCallback = (ctx: CommandContext, ...args: any[]) => void

export class Command<Callback extends CommandCallback = (ctx: CommandContext) => void> {
  static prefixes = ['.', '-']

  static isCommand(message: string) {
    return this.prefixes.some(prefix => message.startsWith(prefix) && message !== prefix)
  }

  static chatSendListener(event: ChatSendAfterEvent) {
    // Hook
  }

  static logger = createLogger('Command')

  static chatListener(event: ChatSendAfterEvent) {
    if (!this.isCommand(event.message)) return this.chatSendListener(event)

    const parsed = parseCommand(event.message, 1)
    if (!parsed) {
      this.logger.player(event.sender).error`Unable to parse: ${event.message}`
      return event.sender.fail(noI18n`Failed to parse command`)
    } else this.logger.player(event.sender).info`Command ${event.message}`

    const { cmd, args, input } = parsed

    const command = Command.commands.find(c => c.sys.name === cmd || c.sys.aliases.includes(cmd))
    if (!command) return commandNotFound(event.sender, cmd)

    if (!command.sys.requires(event.sender)) return commandNoPermissions(event.sender, command)

    if (CmdLet.workWithCmdlets(event, args, command, input) === 'stop') return

    /** Check Args/SubCommands for errors */
    const childs: Command[] = []

    function getChilds(start: Command, i: number): 'fail' | 'success' {
      if (!command) return 'fail'
      if (start.sys.children.length > 0) {
        const child = start.sys.children.find(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          v => v.sys.type.matches(args[i]!).success || (!args[i] && v.sys.type.optional),
        )
        if (!child && !args[i] && start.sys.callback) return 'success'
        if (!child) return commandSyntaxFail(event.sender, command, args, i), 'fail'
        if (!child.sys.requires(event.sender)) return commandNoPermissions(event.sender, child), 'fail'
        childs.push(child)
        return getChilds(child, i + 1)
      }
      return 'success'
    }

    if (getChilds(command, 0) === 'fail') return

    sendCallback(args, childs, event, command, input)
  }

  /** An array of all active commands */
  static commands: Command[] = []

  static getHelpForCommand(command: Command, ctx: CommandContext) {
    return ctx.error(noI18n`Help is disabled`)
  }

  [stringifySymbol]() {
    return `§f${Command.prefixes[0]}${this.getFullName()}`
  }

  private getFullName(name = ''): string {
    const add = (v: string) => (name ? v + ' ' + name : v)
    if (!this.sys.parent) return add(this.sys.name)
    return this.sys.parent.getFullName(add(this.sys.name))
  }

  private static checkIsUnique(name: string) {
    for (const command of this.commands) {
      if (!command.sys.parent && command.sys.name === name) {
        Command.logger
          .warn`Duplicate command name: ${name} at\n${stringifyError.stack.get(2)}${command.stack ? i18n.warn`And:\n${command.stack}` : ''}`
        return
      }
    }
  }

  private stack: string

  sys = {
    /**
     * The name of the command
     *
     * @example
     *   'ban'
     */
    name: 'command',

    /**
     * The description of the command
     *
     * @example
     *   'Bans the player'
     */
    description: '' as Text,

    /**
     * A function that will determine if a player has permission to use this command
     *
     * @example
     *   (player) => player.hasTag('special')
     *
     * @param player This will return the player that uses this command
     * @returns If this player has permission to use this command
     */
    requires: (player: Player) => is(player.id, 'admin'),

    /**
     * Minimal role required to run this command.
     *
     * This is an alias to `requires: (p) => is(player, role)`
     */
    role: 'admin' as Role,
    /**
     * Other names that can call this command
     *
     * @example
     *   ;```["f", "s"]```
     *
     * @example
     *   ;```["f"]```
     */
    aliases: [] as string[],

    /** Group of the command. Used in help. */
    group: 'test' as 'test' | 'we' | 'public',

    /** Argument type of the command */
    type: new LiteralArgumentType('command') as IArgumentType<boolean>,

    /** The Arguments of this command */
    children: [] as Command[],

    /** Depth of this command */
    depth: 0,

    /** Parent command */
    parent: null as Command | null,

    /** Function to run when this command is called */
    callback: null as Callback | null,
  }

  /**
   * Creates new custom command that will be accesible in the chat by using .<cmd>
   *
   * @param {string} name - Name of the new command
   */
  constructor(name: string, type?: IArgumentType<boolean>, depth = 0, parent: Command | null = null) {
    this.stack = stringifyError.stack.get(2)
    if (!parent && !__VITEST__) Command.checkIsUnique(name)

    this.sys.name = name

    if (type) this.sys.type = type
    else this.sys.type.name = name

    if (parent) this.sys.parent = parent

    if (depth === 0) Command.commands.push(this)
  }

  /**
   * How this command works
   *
   * @example
   *   'Bans a player'
   */
  setDescription(string: Text) {
    this.sys.description = string
    return this
  }

  /**
   * Other names that can call this command
   *
   * @example
   *   setAliases('s', 'sc')
   *
   * @example
   *   setAliases('f')
   *
   * @example
   *   new Command('command') // .command
   *   .setAliases('c') // Command now will be available as .c too!
   */
  setAliases(...aliases: string[]) {
    if (!this.sys.parent) for (const alias of aliases) Command.checkIsUnique(alias)

    this.sys.aliases = aliases
    return this
  }

  /**
   * Sets condition that will determine if a player has permission to use this command
   *
   * @example
   *   (player) => is(player, "admin")
   *
   * @example
   *   "admin"
   */
  setPermissions(arg?: Role | ((player: Player) => boolean) | 'everybody'): this

  /**
   * Sets minimal role that allows player to execute the command. Default allowed role is admin.
   *
   * Alias to `setPermissions(p => is(p, role))`
   *
   * @example
   *   'admin'
   *
   * @example
   *   'curator'
   */
  setPermissions(arg?: Role): this

  /** Allows this command to be used by any player. */
  setPermissions(arg?: 'everybody'): this

  /**
   * Adds a function that will determine if a player has permission to use this command
   *
   * @example
   *   (player) => player.hasTag('special)
   */
  setPermissions(arg?: (player: Player) => boolean): this

  /** Sets condition that will determine if a player has permission to use this command */
  setPermissions(arg?: Role | ((player: Player) => boolean) | 'everybody'): this {
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
  setGroup(group: 'test' | 'we' | 'public') {
    this.sys.group = group
    return this
  }

  /**
   * Adds a new branch to this command of your own type
   *
   * @param type A special type to be added
   * @returns New branch to this command
   */
  private argument<T extends IArgumentType<boolean>>(type: T): ArgReturn<Callback, T['type'], T['optional']> {
    const cmd = new Command(this.sys.name, type, this.sys.depth + 1, this)
    cmd.sys.name = this.sys.name
    cmd.sys.description = this.sys.description
    cmd.sys.aliases = this.sys.aliases
    cmd.sys.requires = this.sys.requires
    cmd.sys.role = this.sys.role
    cmd.sys.group = this.sys.group
    cmd.sys.requires = this.sys.requires

    this.sys.children.push(cmd)

    // @ts-expect-error Command this type i hate ts
    return cmd
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param {string} name Name this argument should have
   * @returns New branch to this command
   */
  string<T extends boolean = false>(name: string, optional: T = false as T) {
    return this.argument(new StringArgumentType<T>(name, optional))
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param {string} name Name this argument should have
   * @returns New branch to this command
   */
  int<T extends boolean = false>(name: string, optional: T = false as T) {
    return this.argument(new IntegerArgumentType<T>(name, optional))
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param name Name this argument should have
   * @param types
   * @returns New branch to this command
   */
  array<const T extends string[], B extends boolean = false>(name: string, types: T, optional: B = false as B) {
    return this.argument(new ArrayArgumentType<T, B>(name, types, optional))
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param name Name this argument should have
   * @returns New branch to this command
   */
  boolean<T extends boolean = false>(name: string, optional: T = false as T) {
    return this.argument(new BooleanArgumentType<T>(name, optional))
  }

  /**
   * Adds a branch to this command of type string
   *
   * @param name Name this argument should have
   * @returns New branch to this command
   */
  location<T extends boolean = false>(name: string, optional: T = false as T): ArgReturn<Callback, Vector3, T> {
    const cmd = this.argument(new LocationArgumentType(name, optional))
    if (!name.endsWith('*')) {
      const newArg = cmd.location(name + '_y*', optional).location(name + '_z*', optional)
      // @ts-expect-error Command this type i hate ts
      return newArg
    }
    return cmd
  }

  /**
   * Adds a subCommand to the command
   *
   * @param name Name this literal should have
   * @returns New branch to this command
   */
  overload(name: string, optional = false): Command<Callback> {
    const cmd = new Command(name, new LiteralArgumentType(name, optional), this.sys.depth + 1, this)
    cmd.sys.description = this.sys.description
    cmd.sys.requires = this.sys.requires
    cmd.sys.role = this.sys.role

    this.sys.children.push(cmd)

    // @ts-expect-error Command this type i hate ts
    return cmd
  }

  /**
   * Registers this command and its apendending arguments
   *
   * @param {Callback} callback What to run when this command gets called
   * @returns {Command<Callback>}
   */
  executes(callback: Callback): Command<Callback> {
    this.sys.callback = callback
    return this
  }

  static getHelp(lang: Language, command: Command, description?: string): string[] {
    const type = command.sys.type.toString()
    const base = command.sys.callback ? [`${type}${description ? `§7§o - ${description}` : ''}`] : []
    return base.concat(
      command.sys.children
        .map(e => this.getHelp(lang, e, (e.sys.description || command.sys.description).to(lang)))
        .flat()
        .map(e => type + ' ' + e),
    )
  }
}

type CommandModule = typeof Command

declare global {
  var Command: CommandModule
}

globalThis.Command = Command

world.beforeEvents.chatSend.subscribe(event => {
  event.cancel = true
  system.delay(() => {
    Command.chatListener(event)
  })
})
