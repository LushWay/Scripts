import { MinecraftDimensionTypes, World, world } from '@minecraft/server'
import { util } from '../util'
import { expand } from './extend'

const send = world.sendMessage.bind(world)

expand(World.prototype, {
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
  debug(...data: unknown[]) {
    this.say(data.map((/** @type {any} */ e) => (typeof e === 'string' ? e : util.inspect(e))).join(' '))
  },

  logOnce(name, ...data: unknown[]) {
    if (LOGS.has(name)) return
    world.debug(...data)
    LOGS.add(name)
  },
})

const LOGS = new Set()
