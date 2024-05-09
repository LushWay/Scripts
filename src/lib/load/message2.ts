import { system, world } from '@minecraft/server'
import { CONFIG } from 'lib/assets/config'
import { util } from 'lib/util'

world.afterEvents.worldInitialize.subscribe(() => {
  const players = world.getAllPlayers()
  util.settings.BDSMode = !players.find(e => e.id === CONFIG.singlePlayerHostId)
})

// @ts-expect-error TS(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
const message = `§9└ §fDone in ${((Date.now() - globalThis.loaded) / 1000).toFixed(2)} sec`

system.delay(() => {
  console.log(message)
  world.say(message)
})
