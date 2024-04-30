import { system, world } from '@minecraft/server'
import { CONFIG } from 'lib/Assets/config.js'
import { util } from 'lib/util.js'

world.afterEvents.worldInitialize.subscribe(() => {
  const players = world.getAllPlayers()
  util.settings.BDSMode = !players.find(e => e.id === CONFIG.singlePlayerHostId)
})

const message = `§9└ §fDone in ${((Date.now() - globalThis.loaded) / 1000).toFixed(2)} sec`

system.delay(() => {
  console.log(message)
  world.say(message)
})
