import { Player } from '@minecraft/server'
import { ROLES, getRole } from 'lib'
import { CmdLet } from 'lib/command/cmdlet'
import { Command } from 'lib/command/index'
import { commandNoPermissions, commandNotFound } from 'lib/command/utils'
import { l, t } from 'lib/i18n/text'

const help = new Command('help')
  .setDescription(t`Выводит список команд`)
  .setAliases('?', 'h')
  .setPermissions('everybody')

help
  .int('page', true)
  .int('commandsOnPage', true)
  .executes((ctx, inputPage, commandsOnPage) => {
    const avaibleCommands = Command.commands.filter(e => e.sys.requires(ctx.player))
    const cmds = Math.max(1, commandsOnPage ?? 15)
    const maxPages = Math.ceil(avaibleCommands.length / cmds)
    const page = Math.min(Math.max(inputPage ?? 1, 1), maxPages)
    const path = avaibleCommands.slice(page * cmds - cmds, page * cmds)

    const cv = colors[getRole(ctx.player.id)]

    ctx.reply(l.nocolor`§ы${cv}─═─═─═─═─═ §r${page}/${maxPages} ${cv}═─═─═─═─═─═─`)

    for (const command of path) {
      const q = '§f.'

      const c = `${cv}§r ${q}${command.sys.name} §o§7- ${
        command.sys.description ? command.sys.description : t` Пусто` //§r
      }`
      ctx.reply(l.nocolor`§ы` + c)
    }
    ctx.reply(t`${cv}─═─═─═§f Доступно: ${avaibleCommands.length}/${Command.commands.length} ${cv}═─═─═─═─`)
  })

function helpForCommand(player: Player, commandName: string) {
  const cmd = Command.commands.find(e => e.sys.name == commandName || e.sys.aliases.includes(commandName))

  if (!cmd) return commandNotFound(player, commandName)

  if (!cmd.sys.requires(player)) return commandNoPermissions(player, cmd)

  const d = cmd.sys
  const aliases = d.aliases.length > 0 ? t` §7(также §f` + d.aliases.join('§7, §f') + '§7)§r' : ''
  const overview = t`   §fКоманда §6.${d.name}${aliases}§7§o - ${d.description}`

  player.tell(' ')
  player.tell(overview)
  player.tell(' ')

  let child = false
  for (const subcommand of Command.getHelp(cmd)) {
    child = true
    player.tell(`§7   §f.${subcommand}`)
  }
  if (child) player.tell(' ')
  return
}

Command.getHelpForCommand = (command, ctx) => helpForCommand(ctx.player, command.sys.name)
help.string('commandName').executes((ctx, command) => helpForCommand(ctx.player, command))

new CmdLet('help').setDescription(t`Выводит справку о команде`).executes(ctx => {
  helpForCommand(ctx.player, ctx.command.sys.name)
  return 'stop'
})

const colors: Record<Role, string> = Object.fromEntries(
  Object.entriesStringKeys(ROLES).map(([role, display]) => [role, display.slice(0, 2)]),
)
