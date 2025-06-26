import { Player } from '@minecraft/server'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { noI18n } from '../i18n/text'

/** Creates new logger that will use name as prefix and will output info to the console */
export function createLogger(name: string) {
  name = name.startsWith('§9') ? name : `§9${name}`
  return {
    debug: createLevel(name, 'debug', debug),
    info: createLevel(name, 'info', info),
    error: createLevel(name, 'error', error),
    warn: createLevel(name, 'warn', warn),
    player: (player: Player) => {
      const newName = `${name.trimEnd()} §f§l${player.name}§r `
      const cache = playerLoggers.get(newName)
      if (cache) {
        return cache
      } else {
        const logger = createLogger(newName)
        playerLoggers.set(newName, logger)
        return logger
      }
    },
  }
}

type Logger = ReturnType<typeof createLogger>

const playerLoggers = new WeakPlayerMap<Logger>()

const debug = noI18n.restyle({ unit: '§l§6', text: '§f' })
const info = noI18n
const warn = noI18n.warn
const error = noI18n.error

function createLevel(name: string, level: 'debug' | 'error' | 'info' | 'warn', text: Text.Fn<string, unknown>) {
  return (t: unknown, ...args: unknown[]) => {
    if (isTemplateStringsArray(t)) {
      console[level](name, text(t, ...args))
    } else {
      console[level](name, t, ...args)
    }
  }
}

function isTemplateStringsArray(a: unknown): a is TemplateStringsArray {
  return (
    Array.isArray(a) &&
    a.every(e => typeof e === 'string') &&
    'raw' in a &&
    Array.isArray(a.raw) &&
    a.raw.every(e => typeof e === 'string')
  )
}
