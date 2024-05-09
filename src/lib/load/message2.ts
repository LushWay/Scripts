import { system, world } from '@minecraft/server'

const message = `§9└ §fDone in ${((Date.now() - globalThis.loaded) / 1000).toFixed(2)} sec`

system.delay(() => {
  console.log(message)
  world.say(message)
})
