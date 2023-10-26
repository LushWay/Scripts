import { ChatSendAfterEvent } from '@minecraft/server'
import { CommandContext } from './Context.js'
import { XCommand } from './index.js'

export class CmdLet {
  /**
   * @type {CmdLet[]}
   */
  static ALL = []
  /**
   *
   * @param {string[]} args
   * @param {ChatSendAfterEvent} data
   * @param {XCommand} cmd
   * @param {string} raw
   * @returns
   */
  static workWithCmdlets(data, args, cmd, raw) {
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
    for (const cmdlet of CmdLet.ALL) {
      const input = cmdlets.find(e => e[0] === cmdlet.data.name)
      if (input) {
        results.push(
          cmdlet.data.callback(
            new CommandContext(data, args, cmd, raw),
            input[0]
          )
        )
      }
    }

    if (cmdlets.length > 0 && results.length < 1) {
      const many = cmdlets.length > 1
      data.sender.tell(
        `§cНеизвестны${many ? 'e' : 'й'} командлет${
          many ? 'ы' : ''
        } §f${cmdlets.join(
          '§c, §f'
        )}§c.\nДоступные командлеты: \n§f${CmdLet.ALL.map(
          e => `\n  §f${e.data.name} §7§o- ${e.data.description}`
        )}\n `
      )
      return 'stop'
    }

    if (results.includes('stop')) return 'stop'
  }
  /**
   * Creates a new cmdlet to use it in command like 'name --help'
   * @param {{name: string, callback(ctx: CommandContext, param: string): 'stop' | void, description: string}} info
   */
  constructor({ name, callback, description }) {
    this.data = { name, callback, description }

    CmdLet.ALL.push(this)
  }
}
