import { ChatSendAfterEvent, world } from '@minecraft/server'
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

/** @typedef {import('./types.js').CommandMetadata} CommandMetadata */

/**
 * @template {Function} [Callback=(ctx: CommandContext) => (void | Promise<void>)] . Default is `(ctx: CommandContext)
 *   => (void | Promise<void>)`. Default is `(ctx: CommandContext) => (void | Promise<void>)`
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
    const command = Command.commands.find(c => c.sys.meta.name === cmd || c.sys.meta.aliases?.includes(cmd))
    if (!command) return commandNotFound(event.sender, cmd)
    if (!command.sys.meta?.requires(event.sender)) return commandNoPermissions(event.sender, command)

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
        if (!child.sys.meta?.requires(event.sender)) return commandNoPermissions(event.sender, child), 'fail'
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

  /**
   * @param {CommandMetadata} data
   * @param {IArgumentType} [type]
   * @param {number} [depth]
   * @param {Command<any> | null} [parent]
   */
  constructor(data, type, depth = 0, parent = null) {
    if (!data.requires && !data.role) {
      data.role = 'member'
    }

    if (data.role) {
      data.requires = p => is(p.id, data.role ?? 'admin')
    }

    this.sys = {
      /** @type {CommandMetadata & Required<Pick<CommandMetadata, 'requires' | 'aliases' | 'type'>>} */
      meta: {
        requires: () => true,
        aliases: [],
        type: 'test',
        ...data,
      },
      type: type ?? new LiteralArgumentType(data.name),
      /**
       * The Arguments on this command
       *
       * @type {Command<any>[]}
       */
      children: [],
      depth,
      parent,
      /**
       * Function to run when this command is called
       *
       * @type {Callback | undefined}
       */
      callback: undefined,
    }

    if (depth === 0) Command.commands.push(this)
  }

  /**
   * Adds a ranch to this command of your own type
   *
   * @private
   * @template {IArgumentType} T
   * @param {T} type A special type to be added
   * @returns {import('./types.js').ArgReturn<Callback, T['type']>} New branch to this command
   */
  argument(type) {
    const cmd = new Command(this.sys.meta, type, this.sys.depth + 1, this)
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
   * @returns {import('./types.js').ArgReturn<Callback, T[number]>} New branch to this command
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
   * @returns {import('./types.js').ArgReturn<Callback, Vector3>} New branch to this command
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
   * Adds a subCommand to this argument
   *
   * @param {import('./types.js').CommandMetadata} data Name this literal should have
   * @returns {Command<Callback>} New branch to this command
   */
  literal(data, optional = false) {
    const cmd = new Command(data, new LiteralArgumentType(data.name, optional), this.sys.depth + 1, this)
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
