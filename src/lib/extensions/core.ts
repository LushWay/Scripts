import { Player, system, world } from '@minecraft/server'
import { util } from 'lib/util'
import { EventLoader, EventSignal } from '../EventSignal'

/** Core server features */
const Core = {
  name: '§aLush§bWay',
  beforeEvents: {
    /**
     * Fires when player role changes
     *
     * @type {EventSignal<{ id: string; player?: Player; newRole: Role; oldRole: Role }>}
     */
    roleChange: new EventSignal(),
  },
  /** Core server events */
  afterEvents: {
    /** Event that gets fired when server detects any entity */
    worldLoad: new EventLoader(),
  },
}

type CoreType = typeof Core
declare global {
  // eslint-disable-next-line no-var
  var Core: CoreType
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
  },
)
