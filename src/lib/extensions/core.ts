import { Player, system, world } from '@minecraft/server'
import { EventLoader, EventSignal } from '../event-signal'

/** Core server features */
export const Core = {
  name: '§aLush§fWay',
  beforeEvents: {
    /** Fires when player role changes */
    roleChange: new EventSignal<{ id: string; player?: Player; newRole: Role; oldRole: Role }>(),
  },
  /** Core server events */
  afterEvents: {
    /** Event that gets fired when server detects any entity */
    worldLoad: new EventLoader(),
  },
}

if (!__VITEST__) {
  system.run(function waiter() {
    const entities = world.overworld.getEntities()
    if (entities.length < 1) {
      // No entity found, re-run waiter
      return system.run(waiter)
    }

    try {
      EventLoader.load(Core.afterEvents.worldLoad)
    } catch (e) {
      console.error(e)
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
} else {
  EventLoader.load(Core.afterEvents.worldLoad)
}
