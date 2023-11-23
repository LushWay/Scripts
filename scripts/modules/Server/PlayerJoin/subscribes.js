import { JOIN, shortTime, timeNow } from './var.js'

JOIN.EVENT_DEFAULTS.join = JOIN.EVENTS.join.subscribe(player => {
  player.tell(`${timeNow()}, ${player.name}!\n§r§3Время §b• §3${shortTime()}`)
}, -1)
