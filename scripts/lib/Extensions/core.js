import { system, world } from '@minecraft/server'
import { util } from 'lib/util.js'
import { EventLoader } from '../EventSignal.js'

/**
 * Core server features
 */
class Core {
  /**
   * Core server events
   */
  static afterEvents = {
    /**
     * Event that gets fired when server
     * detects any entity
     */
    worldLoad: new EventLoader(),
  }
}

globalThis.Core = Core

system.run(function waiter() {
  const entities = world.overworld.getEntities()
  if (entities.length < 1) {
    // No entity found, re-run waiter
    return system.run(waiter)
  }

  try {
    EventLoader.load(Core.afterEvents.worldLoad)
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
