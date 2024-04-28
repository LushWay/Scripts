import { ChatSendAfterEvent, Player } from '@minecraft/server'
import { CONFIG, SOUNDS } from 'config.js'
import { isProduction } from 'lib/GameUtils.js'
import { ROLES } from 'lib/roles.js'
import { inaccurateSearch } from '../Search.js'
import { util } from '../util.js'
import { LiteralArgumentType, LocationArgumentType } from './ArgumentTypes.js'
import { CommandContext } from './Context.js'

/**
 * @param {string} message
 * @param {number} prefixSize
 * @returns
 */
export function parseCommand(message, prefixSize = 1) {
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
export function parseArguments(message) {
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
 * @param {Player} player Player to send message to
 * @param {string} command
 * @returns {void}
 */
export function commandNotFound(player, command) {
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
  player.playSound(SOUNDS.fail)

  suggestCommand(player, command)
  player.tell('§cСписок всех доступных вам команд: §f.help')
}

/**
 * Sends a command not found message to a player
 *
 * @param {Player} player Player to send message to
 * @param {string} command
 * @returns {void}
 */
function suggestCommand(player, command) {
  if (!command) return

  const cmds = new Set()

  for (const c of Command.commands.filter(e => e.sys.meta.requires && e.sys.meta.requires(player))) {
    cmds.add(c.sys.meta.name)
    if (c.sys.meta.aliases && c.sys.meta.aliases?.length > 0) {
      c.sys.meta.aliases.forEach(e => cmds.add(e))
    }
  }
  let search = inaccurateSearch(command, [...cmds.values()])

  const options = {
    minMatchTriggerValue: 0.5,
    maxDifferenceBeetwenSuggestions: 0.15,
    maxSuggestionsCount: 3,
  }

  if (!search[0] || (search[0] && search[0][1] < options.minMatchTriggerValue)) return

  const suggest = (/** @type {[string, number]} */ a) => `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%%)§c`

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
 * @param {Player} player Player to send message to
 * @param {import('./index.js').Command} command
 * @returns {void}
 */
export function commandNoPermissions(player, command) {
  let additional = ''
  if (!isProduction() && command.sys.meta.role) {
    additional += `\n§cКоманда доступна начиная с роли ${ROLES[command.sys.meta.role]}§c`
  }
  player.fail(
    command.sys.meta.invaildPermission
      ? command.sys.meta.invaildPermission
      : `§cУ вас нет разрешения для использования команды §f${command.sys.meta.name}${additional}\n§cСписок всех доступных вам команд: §f.help`,
  )
}

/**
 * Sends a syntax failure message to player
 *
 * @param {Player} player Undefined
 * @param {import('./index.js').Command} command Undefined
 * @param {string[]} args Undefined
 * @param {number} i Undefined
 * @returns {void}
 */
export function commandSyntaxFail(player, command, args, i) {
  player.tell({
    rawtext: [
      {
        text: `§c`,
      },
      {
        translate: `commands.generic.syntax`,
        with: [
          `${CONFIG.commandPrefixes[0]}${command.sys.meta.name} ${args.slice(0, i).join(' ')}`,
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
 *
 * @param {[x: string, y: string, z: string]} a0
 * @param {{ location: Vector3; getViewDirection(): Vector3 }} data
 * @returns {{ x: number; y: number; z: number } | null}
 */
export function parseLocationArguments([x, y, z], data) {
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
 * @param {string[]} cmdArgs The args that the command used
 * @param {import('./index.js').Command[]} args Args to use
 * @param {ChatSendAfterEvent} event
 * @param {import('./index.js').Command} baseCommand
 * @param {string} rawInput
 */
export function sendCallback(cmdArgs, args, event, baseCommand, rawInput) {
  const lastArg = args[args.length - 1] ?? baseCommand
  /** @type {any[]} */
  const argsToReturn = []
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
    console.warn('Not implemented: ')
    return event.sender.warn('Упс, эта команда пока не работает.')
  }

  ;(async () => {
    try {
      await lastArg.sys.callback?.(
        new CommandContext(event, cmdArgs, baseCommand, rawInput),
        // @ts-expect-error Typescript is bad at understanding generics
        ...argsToReturn,
      )
    } catch (e) {
      event.sender.warn(
        'При выполнении команды произошла ошибка. Разработчики уже оповещены о проблеме и работают над ее исправлением.',
      )
      util.error(e)
    }
  })().catch(error => util.error(error))
}
