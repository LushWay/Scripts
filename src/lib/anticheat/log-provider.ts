import { createLogger } from 'lib/utils/logger'

export const antiCheatLogger = createLogger('anticheat')

export function antiCheatLog(text: string) {
  if (!log) return antiCheatLogger.warn('No provider: ', text)

  antiCheatLogger.warn(text)
  log(text)
}

let log: null | ((text: string) => void) = null

export function registerAntiCheatLogProvider(provider: typeof log) {
  log = provider
}
