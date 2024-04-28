import { MinecraftDimensionTypes, World, world } from '@minecraft/server'
import { util } from '../util.js'
import { OverTakes } from './OverTakes.js'

const send = world.sendMessage.bind(world)

OverTakes(World.prototype, {
  say(message) {
    if (globalThis.Core?.afterEvents?.worldLoad?.loaded) {
      this.say = send
      return send(message)
    }

    if (typeof message === 'string' && !message.startsWith('§9')) message = '§9│ ' + message.replace(/\n/g, '\n§9│ §r')

    send(message)
  },
  overworld: world.getDimension(MinecraftDimensionTypes.overworld),
  nether: world.getDimension(MinecraftDimensionTypes.nether),
  end: world.getDimension(MinecraftDimensionTypes.theEnd),
  debug(...data) {
    this.say(data.map((/** @type {any} */ e) => (typeof e === 'string' ? e : util.inspect(e))).join(' '))
  },
  logOnce(name, ...data) {
    if (LOGS.has(name)) return
    world.debug(...data)
    LOGS.add(name)
  },
})

const LOGS = new Set()
