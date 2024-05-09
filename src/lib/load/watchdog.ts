import { system, WatchdogTerminateReason, world } from '@minecraft/server'

declare global {
  // eslint-disable-next-line no-var
  var loaded: number
}

globalThis.loaded = Date.now()

const reasons: Record<WatchdogTerminateReason, string> = {
  Hang: 'Скрипт завис',
  StackOverflow: 'Стэк переполнен',
}

system.beforeEvents.watchdogTerminate.subscribe(event => {
  world.say('§cСобакаСутулая: §f' + reasons[event.terminateReason])
  event.cancel = true
})
