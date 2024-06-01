import { ChatSendAfterEvent, Player } from '@minecraft/server'
import { Sounds } from 'lib/assets/config'
import { ROLES } from 'lib/roles'
import { inaccurateSearch } from '../search'
import { LiteralArgumentType, LocationArgumentType } from './argument-types'
import { CommandContext } from './context'

export function parseCommand(message: string, prefixSize = 1) {
  const command = message.slice(prefixSize).trim()

  const match = command.match(/^(?<command>[^\s]+)\s?(?<input>.+)?$/)
  if (!match || !match.groups || !match.groups.command) return false

  const cmd = match.groups.command
  const input = match.groups.input ?? ''
  const args = parseArguments(input)

  return { cmd, args, input }
}

/**
 * @param {string} message
 * @returns {string[]}
 */
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
        with: [`${command}`],
      },
    ],
  })
  player.playSound(Sounds.Fail)

  suggestCommand(player, command)
  player.tell('§cСписок всех доступных вам команд: §f.help')
}

/**
 * Sends a command not found message to a player
 *
 * @param player Player to send message to
 */
function suggestCommand(player: Player, command: string): void {
  if (!command) return

  const cmds = new Set<string>()

  for (const c of Command.commands.filter(e => e.sys.requires && e.sys.requires(player))) {
    cmds.add(c.sys.name)
    if (c.sys.aliases && c.sys.aliases?.length > 0) {
      c.sys.aliases.forEach(e => cmds.add(e))
    }
  }
  let search = inaccurateSearch(command, [...cmds.values()])

  const options = {
    minMatchTriggerValue: 0.5,
    maxDifferenceBeetwenSuggestions: 0.15,
    maxSuggestionsCount: 3,
  }

  if (!search[0] || (search[0] && search[0][1] < options.minMatchTriggerValue)) return

  const suggest = (a: [string, number]) => `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%%)§c`

  let suggestion = '§cВы имели ввиду ' + suggest(search[0])
  const firstValue = search[0][1]
  search = search
    .filter(e => firstValue - e[1] <= options.maxDifferenceBeetwenSuggestions)
    .slice(1, options.maxSuggestionsCount)

  for (const [i, e] of search.entries()) suggestion += `${i + 1 === search.length ? ' или ' : ', '}${suggest(e)}`

  player.tell(suggestion + '§c?')
}

/**
 * Sends a command not found message to a player
 *
 * @param player Player to send message to
 */
export function commandNoPermissions(player: Player, command: import('./index').Command): void {
  let additional = ''
  if (__DEV__ && command.sys.role) {
    additional += `\n§cКоманда доступна начиная с роли ${ROLES[command.sys.role]}§c`
  }
  player.fail(
    `§cУ вас нет разрешения для использования команды §f${command.sys.name}${additional}\n§cСписок всех доступных вам команд: §f.help`,
  )
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
    const r = parseFloat(arg?.replace(/^[~^]/g, ''))
    return isNaN(r) ? 0 : r
  })
  const b = [x, y, z].map((arg, index) => {
    return arg.includes('~')
      ? a[index] + locations[index]
      : arg.includes('^')
        ? a[index] + viewVectors[index]
        : a[index]
  })
  return { x: b[0], y: b[1], z: b[2] }
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
        parseLocationArguments([cmdArgs[i], cmdArgs[i + 1], cmdArgs[i + 2]], event.sender) ?? event.sender.location,
      )
      continue
    }
    if (arg.sys.type instanceof LiteralArgumentType) continue
    argsToReturn.push(arg.sys.type.matches(cmdArgs[i]).value ?? cmdArgs[i])
  }
  if (typeof lastArg.sys.callback !== 'function') {
    console.warn('Command not implemented: ', lastArg)
    return event.sender.warn('Упс, эта команда пока не работает.')
  }

  ;(async () => {
    try {
      await lastArg.sys.callback?.(new CommandContext(event, cmdArgs, baseCommand, rawInput), ...argsToReturn)
    } catch (e) {
      event.sender.warn(
        'При выполнении команды произошла ошибка. Разработчики уже оповещены о проблеме и работают над ее исправлением.',
      )
      console.error(e)
    }
  })().catch(console.error)
}
