import { Player } from '@minecraft/server'
import { ROLES, getRole } from 'lib'
import { defaultLang } from 'lib/assets/lang'
import { CmdLet } from 'lib/command/cmdlet'
import { Command } from 'lib/command/index'
import { commandNoPermissions, commandNotFound } from 'lib/command/utils'
import { i18n, noI18n } from 'lib/i18n/text'

const help = new Command('help')
  .setDescription(i18n`Выводит список команд`)
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

    ctx.reply(noI18n.nocolor`${cv}─═─═─═─═─═ §r${page}/${maxPages} ${cv}═─═─═─═─═─═─`)

    for (const command of path) {
      const q = '§f.'

      const c = i18n.nocolor`${cv}§r ${q}${command.sys.name} §o§7- ${
        command.sys.description ? command.sys.description.to(ctx.player.lang) : i18n`Пусто` //§r
      }`.to(ctx.player.lang)

      ctx.reply(c)
    }
    ctx.reply(i18n.nocolor`${cv}─═─═─═§f Доступно: ${avaibleCommands.length}/${Command.commands.length} ${cv}═─═─═─═─`)
  })

function helpForCommand(player: Player, commandName: string) {
  const cmd = Command.commands.find(e => e.sys.name == commandName || e.sys.aliases.includes(commandName))

  if (!cmd) return commandNotFound(player, commandName)

  if (!cmd.sys.requires(player)) return commandNoPermissions(player, cmd)

  const d = cmd.sys
  const aliases = d.aliases.length > 0 ? i18n` (также ${d.aliases.join(', ')})` : ''
  const overview = i18n.nocolor`   §fКоманда §6.${d.name}${aliases}§7§o - ${d.description}`

  player.tell(' ')
  player.tell(overview)
  player.tell(' ')

  let child = false
  for (const subcommand of Command.getHelp(player.lang, cmd)) {
    child = true
    player.tell(`§7   §f.${subcommand}`)
  }
  if (child) player.tell(' ')
  return
}

Command.getHelpForCommand = (command, ctx) => helpForCommand(ctx.player, command.sys.name)
help.string('commandName').executes((ctx, command) => helpForCommand(ctx.player, command))

new CmdLet('help').setDescription(i18n`Выводит справку о команде`).executes(ctx => {
  helpForCommand(ctx.player, ctx.command.sys.name)
  return 'stop'
})

const colors: Record<Role, string> = Object.fromEntries(
  Object.entriesStringKeys(ROLES).map(([role, display]) => [role, display.to(defaultLang).slice(0, 2)]),
)
