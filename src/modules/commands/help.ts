import { Player } from '@minecraft/server'
import { ROLES, getRole } from 'lib'
import { CmdLet } from 'lib/command/cmdlet'
import { Command } from 'lib/command/index'
import { commandNoPermissions, commandNotFound } from 'lib/command/utils'

const help = new Command('help')
  .setDescription('Выводит список команд')
  .setAliases('?', 'h')
  .setPermissions('everybody')

help
  .int('page', true)
  .int('commandsInPage', true)
  .executes((ctx, inputPage, commandsInPage) => {
    const avaibleCommands = Command.commands.filter(e => e.sys.requires(ctx.player))
    const cmds = commandsInPage || 15
    const maxPages = Math.ceil(avaibleCommands.length / cmds)
    const page = Math.min(inputPage || 1, maxPages)
    const path = avaibleCommands.slice(page * cmds - cmds, page * cmds)

    const cv = colors[getRole(ctx.player.id)]

    ctx.reply(`§ы${cv}─═─═─═─═─═ §r${page}/${maxPages} ${cv}═─═─═─═─═─═─`)

    for (const command of path) {
      const q = '§f.'

      const c = `${cv}§r ${q}${command.sys.name} §o§7- ${
        command.sys.description ? `${command.sys.description}` : ' Пусто' //§r
      }`
      ctx.reply('§ы' + c)
    }
    ctx.reply(`${cv}─═─═─═§f Доступно: ${avaibleCommands.length}/${Command.commands.length} ${cv}═─═─═─═─`)
  })

/**
 * @param {Player} player
 * @param {string} commandName
 * @returns
 */

function helpForCommand(player: Player, commandName: string) {
  const cmd = Command.commands.find(e => e.sys.name == commandName || e.sys?.aliases?.includes(commandName))

  if (!cmd) return commandNotFound(player, commandName)

  if (!cmd.sys?.requires(player)) return commandNoPermissions(player, cmd)

  const d = cmd.sys
  const aliases = d.aliases?.length > 0 ? '§7(также §f' + d.aliases.join('§7, §f') + '§7)§r' : ''
  const str = `   §fКоманда §6-${d.name} ${aliases}`

  // ctx.reply(`§7§ы┌──`);
  player.tell(' ')
  player.tell(str)
  player.tell(' ')

  let l = str.length

  for (const [command, description] of childrensToHelpText(player, cmd).map(e => getParentType(e))) {
    const _ = `§7   §f-${command}§7§o - ${description}§r`
    l = Math.max(l, _.length)
    player.tell(_)
  }
  player.tell(' ')
  // ctx.reply(`${new Array(l).join(" ")}§7§ы──┘`);
  return
}

Command.getHelpForCommand = (command, ctx) => helpForCommand(ctx.player, command.sys.name)
help.string('commandName').executes((ctx, command) => helpForCommand(ctx.player, command))

new CmdLet('help').setDescription('Выводит справку о команде').executes(ctx => {
  helpForCommand(ctx.player, ctx.command.sys.name)
  return 'stop'
})

/**
 * @param {Player} player
 * @param {Command} command
 * @returns {Command<any>[]}
 */

function childrensToHelpText(player: Player, command: Command): Command<any>[] {
  const childrens = []

  for (const children of command.sys.children.filter(e => e.sys.requires(player))) {
    if (children.sys.children.length < 1) childrens.push(children)
    else childrens.push(...childrensToHelpText(player, children))
  }
  return childrens
}

function getParentType(command: Command, init = true): [string, undefined | string] {
  const curtype = getType(command)

  let description

  if (init && command.sys.description) {
    description = command.sys.description
    init = false
  }

  if (command.sys.depth === 0 || !command.sys.parent) return [curtype, description]
  else {
    const parents = getParentType(command.sys.parent, init)
    return [`${parents[0]}§f ${curtype}`, description ?? parents[1] ?? '<нет описания>']
  }
}

function getType(o: Command) {
  const t = o.sys.type
  const q = t.optional

  if (t.typeName === 'literal') return `${q ? '§7' : '§f'}${t.name}`
  return `${q ? `§7[${t.name}: §7${t.typeName}§7]` : `§6<${t.name}: §6${t.typeName}§6>`}`
}

const colors: Record<Role, string> = Object.fromEntries(
  Object.entriesStringKeys(ROLES).map(e => [e[0], e[1][0] + e[1][1]]),
)
colors.member = '§2'
