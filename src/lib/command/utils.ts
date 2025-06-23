import { ChatSendAfterEvent, Player } from '@minecraft/server'
import { Sounds } from 'lib/assets/custom-sounds'
import { developersAreWarned } from 'lib/assets/text'
import { ROLES } from 'lib/roles'
import { l, t } from 'lib/text'
import { inaccurateSearch } from '../utils/search'
import { LiteralArgumentType, LocationArgumentType } from './argument-types'
import { CommandContext } from './context'

export function parseCommand(message: string, prefixSize = 1) {
  const command = message.slice(prefixSize).trim()

  const match = /^(?<command>[^\s]+)\s?(?<input>.+)?$/.exec(command)
  if (!match?.groups?.command) return false

  const cmd = match.groups.command
  const input = (match.groups.input as string | undefined) ?? ''
  const args = parseArguments(input)

  return { cmd, args, input }
}

export function parseArguments(message: string): string[] {
  const augments = message
    .trim()
    .replace(/([~^][^~^\s]*)/g, '$1 ')
    .match(/"[^"]+"|[^\s]+/g)
  if (augments) return augments.map(e => e.replace(/"(.+)"/, '$1').toString())
  return []
}

/**
 * Sends a command not found message to a player
 *
 * @param player Player to send message to
 */
export function commandNotFound(player: Player, command: string): void {
  player.tell({
    rawtext: [
      {
        text: `§c`,
      },
      {
        translate: `commands.generic.unknown`,
        with: [command],
      },
    ],
  })
  player.playSound(Sounds.Fail)

  suggestCommand(player, command)
  player.tell(t.error`Список всех доступных вам команд: §f.help`)
  Command.logger.player(player).warn`Unknown command: ${command}`
}

/**
 * Sends a command not found message to a player
 *
 * @param player Player to send message to
 */
function suggestCommand(player: Player, command: string): void {
  if (!command) return

  const cmds = new Set<string>()

  for (const c of Command.commands.filter(e => e.sys.requires(player))) {
    cmds.add(c.sys.name)
    if (c.sys.aliases.length > 0) {
      c.sys.aliases.forEach(e => cmds.add(e))
    }
  }
  let search = inaccurateSearch(command, [...cmds.values()])

  const options = {
    minMatchTriggerValue: 0.5,
    maxDifferenceBeetwenSuggestions: 0.15,
    maxSuggestionsCount: 3,
  }

  if (!search[0] || search[0][1] < options.minMatchTriggerValue) return

  const suggest = (a: [string, number]) => `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%%)§c`

  let suggestion = t`§cВы имели ввиду ${suggest(search[0])}`
  const firstValue = search[0][1]
  search = search
    .filter(e => firstValue - e[1] <= options.maxDifferenceBeetwenSuggestions)
    .slice(1, options.maxSuggestionsCount)

  for (const [i, e] of search.entries()) suggestion += `${i + 1 === search.length ? t` или ` : ', '}${suggest(e)}`

  player.tell(suggestion + '§c?')
}

/**
 * Sends a command not found message to a player
 *
 * @param player Player to send message to
 */
export function commandNoPermissions(player: Player, command: import('./index').Command): void {
  let additional = ''
  if (!__RELEASE__ && typeof command.sys.role !== 'undefined') {
    additional += t.error`\nКоманда доступна начиная с роли ${ROLES[command.sys.role]}`
  }
  player.fail(
    t.error`У вас нет разрешения для использования команды ${command.sys.name}${additional}\nСписок всех доступных вам команд: §f.help`,
  )

  Command.logger.player(player).warn`No permission to use ${command}`
}

/** Sends a syntax failure message to player */
export function commandSyntaxFail(player: Player, command: import('./index').Command, args: string[], i: number) {
  player.tell({
    rawtext: [
      {
        text: `§c`,
      },
      {
        translate: `commands.generic.syntax`,
        with: [
          `${Command.prefixes[0]}${command.sys.name} ${args.slice(0, i).join(' ')}`,
          args[i] ?? ' ',
          args.slice(i + 1).join(' '),
        ],
      },
    ],
  })
}

/**
 * Returns a location of the inputed aguments
 *
 * @example
 *   parseLocationAugs(['~1', '3', '^7'], { location: [1, 2, 3], viewVector: [1, 2, 3] })
 */
export function parseLocationArguments(
  [x, y, z]: [x: string, y: string, z: string],
  data: { location: Vector3; getViewDirection(): Vector3 },
): { x: number; y: number; z: number } | null {
  const { location } = data
  const viewVector = data.getViewDirection()
  if (typeof x !== 'string' || typeof y !== 'string' || typeof z !== 'string') return null

  const locations = [location.x, location.y, location.z]
  const viewVectors = [viewVector.x, viewVector.y, viewVector.z]
  const a = [x, y, z].map(arg => {
    const r = parseFloat(arg.replace(/^[~^]/g, ''))
    return isNaN(r) ? 0 : r
  })
  const b = [x, y, z].map((arg, index) => {
    return arg.includes('~')
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        a[index]! + locations[index]!
      : arg.includes('^')
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          a[index]! + viewVectors[index]!
        : a[index]
  })
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { x: b[0]!, y: b[1]!, z: b[2]! }
}

/**
 * Sends a callback back to the command
 *
 * @param cmdArgs The args that the command used
 * @param args Args to use
 * @param event
 * @param baseCommand
 * @param rawInput
 */
export function sendCallback(
  cmdArgs: string[],
  args: import('./index').Command[],
  event: ChatSendAfterEvent,
  baseCommand: import('./index').Command,
  rawInput: string,
) {
  const lastArg = args[args.length - 1] ?? baseCommand
  const argsToReturn: unknown[] = []
  for (const [i, arg] of args.entries()) {
    if (arg.sys.type.name.endsWith('*')) continue
    if (arg.sys.type instanceof LocationArgumentType) {
      argsToReturn.push(
        parseLocationArguments(cmdArgs as [string, string, string], event.sender) ?? event.sender.location,
      )
      continue
    }
    if (arg.sys.type instanceof LiteralArgumentType) continue
    if (cmdArgs[i]) argsToReturn.push(arg.sys.type.matches(cmdArgs[i]).value ?? cmdArgs[i])
  }
  if (typeof lastArg.sys.callback !== 'function') {
    console.warn('Command not implemented: ', lastArg)
    return event.sender.warn(l`Command not implemented.`)
  }

  ;(async () => {
    try {
      await (lastArg.sys.callback?.(
        new CommandContext(event, cmdArgs, baseCommand, rawInput),
        // @ts-expect-error AAAAAAAAAAAA
        ...argsToReturn,
      ) as Promise<void> | void)
    } catch (e) {
      event.sender.warn(t`При выполнении команды произошла ошибка. ${developersAreWarned}`)
      console.error(e)
    }
  })()
}
