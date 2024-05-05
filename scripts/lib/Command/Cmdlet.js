import { ChatSendAfterEvent } from '@minecraft/server'
import { CommandContext } from './Context.js'

export class CmdLet {
  /** @type {CmdLet[]} */
  static list = []

  /**
   * @param {ChatSendAfterEvent} event
   * @param {string[]} args
   * @param {import('./index.js').Command} command
   * @param {string} rawInput
   */
  static workWithCmdlets(event, args, command, rawInput) {
    const cmdlets = args
      .filter(e => e.startsWith('--'))
      .map(e => {
        // Remove -- part
        e = e.substring(2)

        // Bool or --help like cmdlet
        if (!e.includes('=')) return [e, '']

        const [cmdlet, ...arg] = e.split('=')
        return [cmdlet, arg.join('=')]
      })

    const results = []
    for (const cmdlet of CmdLet.list) {
      const input = cmdlets.find(e => e[0] === cmdlet.name)
      if (input) {
        results.push(cmdlet.callback?.(new CommandContext(event, args, command, rawInput), input[0]))
      }
    }

    if (cmdlets.length > 0 && results.length < 1) {
      const many = cmdlets.length > 1
      event.sender.fail(
        `§cНеизвестны${many ? 'e' : 'й'} командлет${many ? 'ы' : ''} §f${cmdlets.join(
          '§c, §f',
        )}§c.\nДоступные командлеты: \n§f${CmdLet.list.map(e => `\n  §f${e.name} §7§o- ${e.description}`)}\n `,
      )
      return 'stop'
    }

    if (results.includes('stop')) return 'stop'
  }

  /**
   * Creates a new cmdlet to use it in command like 'name --help'
   *
   * @param {string} name
   */
  constructor(name) {
    this.name = name

    CmdLet.list.push(this)
  }

  /** @param {string} string */
  setDescription(string) {
    this.description = string

    return this
  }

  /** @param {(ctx: CommandContext, param: string) => 'stop' | void} callback */
  executes(callback) {
    this.callback = callback

    return this
  }
}
