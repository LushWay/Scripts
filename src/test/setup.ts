import 'lib/load/enviroment'

import 'lib/database/player'

import 'lib/command'

import 'lib/database/scoreboard'

import { world } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { Area } from 'lib/region/areas/area'
Area.loaded = false

setImmediate(() => {
  // @ts-expect-error assssssssssssssssssssss
  EventSignal.emit(world.afterEvents.worldLoad, {})
})
