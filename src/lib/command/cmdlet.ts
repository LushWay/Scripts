import { ChatSendAfterEvent } from '@minecraft/server'
import { i18n } from 'lib/i18n/text'
import { CommandContext } from './context'
import { Command } from './index'

type CmdLetCallback = (ctx: CommandContext, param: string) => 'stop' | void

export class CmdLet {
  static list: CmdLet[] = []

  callback: CmdLetCallback | undefined

  description: Text | undefined

  name: string

  static workWithCmdlets(event: ChatSendAfterEvent, args: string[], command: Command, rawInput: string) {
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
      if (input?.[0] && cmdlet.callback) {
        results.push(cmdlet.callback(new CommandContext(event, args, command, rawInput), input[0]))
      }
    }

    if (cmdlets.length > 0 && results.length < 1) {
      event.sender.fail(
        i18n.error`Неизвестный аргумент: ${cmdlets.join(
          '§c, §f',
        )}.\nДоступные командлеты: \n${CmdLet.list.map(e => i18n.nocolor.join`\n  §f${e.name} §7§o- ${e.description}`.to(event.sender.lang)).join('')}\n `,
      )
      return 'stop'
    }

    if (results.includes('stop')) return 'stop'
  }

  /** Creates a new cmdlet to use it in command like 'name --help' */
  constructor(name: string) {
    this.name = name
    CmdLet.list.push(this)
  }

  setDescription(string: Text) {
    this.description = string
    return this
  }

  executes(callback: CmdLetCallback) {
    this.callback = callback
    return this
  }
}
