import { ChatSendAfterEvent, Player } from '@minecraft/server'
import { CONFIG, SOUNDS } from 'config.js'
import { inaccurateSearch } from '../Class/Search.js'
import { util } from '../util.js'
import { LiteralArgumentType, LocationArgumentType } from './ArgumentTypes.js'
import { CommandContext } from './Context.js'

/**
 * @param {string} message
 * @param {string} prefix
 * @returns {string[]}
 */
export function parseArguments(message, prefix) {
  const augments = message
    .slice(prefix.length)
    .trim()
    .replace(/([~^][^~^\s]*)/g, '$1 ')
    .match(/"[^"]+"|[^\s]+/g)
  if (augments) return augments.map(e => e.replace(/"(.+)"/, '$1').toString())
  return []
}

/**
 * Sends a command not found message to a player
 * @param {Player} player  player to send message to
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

  if (!command) return

  const cmds = new Set()

  for (const c of Command.commands.filter(e => e.sys.data.requires && e.sys.data.requires(player))) {
    cmds.add(c.sys.data.name)
    if (c.sys.data.aliases && c.sys.data.aliases?.length > 0) {
      c.sys.data.aliases.forEach(e => cmds.add(e))
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
 * @param {Player} player  player to send message to
 * @param {import('./index.js').Command} command
 * @returns {void}
 */
export function commandNoPermissions(player, command) {
  player.tell({
    rawtext: [
      {
        text: command.sys.data.invaildPermission
          ? command.sys.data.invaildPermission
          : `§cУ вас нет разрешения для использования команды §f${command.sys.data.name}`,
      },
    ],
  })
  player.playSound(SOUNDS.fail)
}

/**
 * Sends a syntax failure message to player
 * @param {Player} player  undefined
 * @param {import('./index.js').Command} command  undefined
 * @param {string[]} args  undefined
 * @param {number} i  undefined
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
          `${CONFIG.commandPrefix}${command.sys.data.name} ${args.slice(0, i).join(' ')}`,
          args[i] ?? ' ',
          args.slice(i + 1).join(' '),
        ],
      },
    ],
  })
}

/**
 * Returns a location of the inputed aguments
 * @example parseLocationAugs(["~1", "3", "^7"], { location: [1,2,3] , viewVector: [1,2,3] })
 * @param {[x: string, y: string, z: string]} a0
 * @param {{ location: Vector3; getViewDirection(): Vector3 }} data
 * @returns {{x: number, y: number, z: number} | null}
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
 * @param {string[]} cmdArgs the args that the command used
 * @param {import('./index.js').Command[]} args args to use
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
        parseLocationArguments([cmdArgs[i], cmdArgs[i + 1], cmdArgs[i + 2]], event.sender) ?? event.sender.location
      )
      continue
    }
    if (arg.sys.type instanceof LiteralArgumentType) continue
    argsToReturn.push(arg.sys.type.matches(cmdArgs[i]).value ?? cmdArgs[i])
  }
  if (typeof lastArg.sys.callback !== 'function') return event.sender.tell('§6⚠ Упс, эта команда пока не работает.')

  util.catch(
    () =>
      lastArg.sys.callback?.(
        new CommandContext(event, cmdArgs, baseCommand, rawInput),
        // @ts-expect-error Huh
        ...argsToReturn
      ),
    'Command'
  )
}
