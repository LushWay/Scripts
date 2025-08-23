/* i18n-ignore */
import { system, WatchdogTerminateReason, world } from '@minecraft/server'

declare global {
  var loaded: number
}

globalThis.loaded = Date.now()

//@ts-expect-error Define global intl if not defined
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
globalThis.Intl ??= {}

const reasons: Record<WatchdogTerminateReason, string> = {
  Hang: 'Скрипт завис',
  StackOverflow: 'Стэк переполнен',
}

system.beforeEvents.watchdogTerminate.subscribe(event => {
  world.say('§cСобакаСутулая: §f' + reasons[event.terminateReason])
  event.cancel = true
})
