import { system, world } from '@minecraft/server'
import { util } from 'lib/util.js'
import { EventLoader } from '../EventSignal.js'

/**
 * Class because variable hoisting
 */
class SM {
  static afterEvents = {
    worldLoad: new EventLoader(),
  }
}
globalThis.SM = SM

system.run(async function waiter() {
  const entities = await world.overworld.runCommandAsync(`testfor @e`)
  if (entities.successCount < 1) {
    // No entity found, we need to re-run this...
    return system.run(waiter)
  }

  try {
    EventLoader.load(SM.afterEvents.worldLoad)
  } catch (e) {
    util.error(e, { errorName: 'LoadError' })
  }
})

system.afterEvents.scriptEventReceive.subscribe(
  data => {
    if (data.id === 'SERVER:SAY') {
      world.say(decodeURI(data.message))
    }
  },
  {
    namespaces: ['SERVER'],
  }
)
