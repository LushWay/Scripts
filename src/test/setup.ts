import 'lib/load/enviroment'

import 'lib/database/player'

import 'lib/command'

import { Area } from 'lib/region/areas/area'
Area.loaded = false

// Determenstic test results across all enviroments
if ('process' in globalThis) {
  // @ts-expect-error No node types installed because they pollute globals
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  process.env.TZ = 'Europe/Moscow'
}


