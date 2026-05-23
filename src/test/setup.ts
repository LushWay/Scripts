import 'lib/load/enviroment'

import 'lib/database/player'

import 'lib/command'

import 'lib/database/scoreboard'

import { world } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { Area } from 'lib/region/areas/area'
Area.loaded = false

// @ts-expect-error We're not including node types to not pollute global
setImmediate(() => {
  // @ts-expect-error We're not including node types to not pollute global
  EventSignal.emit(world.afterEvents.worldLoad, {})
})
