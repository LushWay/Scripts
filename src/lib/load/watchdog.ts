import { system, WatchdogTerminateReason, world } from '@minecraft/server'

// @ts-expect-error TS(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
globalThis.loaded = Date.now()

/** @type {Record<WatchdogTerminateReason, string>} */
const reasons = {
  Hang: 'Скрипт завис',
  StackOverflow: 'Стэк переполнен',
}

system.beforeEvents.watchdogTerminate.subscribe(event => {
  // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  world.say('§cСобакаСутулая: §f' + reasons[event.terminateReason])
  event.cancel = true
})
