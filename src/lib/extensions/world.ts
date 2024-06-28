import { World, world } from '@minecraft/server'
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data'
import { stringify, util } from '../util'
import { Core } from './core'
import { expand } from './extend'

declare module '@minecraft/server' {
  interface World {
    /** See {@link World.sendMessage} */
    say(message: (RawMessage | string)[] | RawMessage | string): void

    /**
     * Logs given message once
     *
     * @param type Type of log
     * @param messages Data to log using world.debug()
     */
    logOnce(type: string, ...messages: unknown[]): void

    /** Prints data using world.say() and parses any object to string using toStr method. */
    debug(...data: unknown[]): void
    overworld: Dimension
    end: Dimension
    nether: Dimension
  }
}

const send = world.sendMessage.bind(world)

expand(World.prototype, {
  say(message) {
    if (Core.afterEvents.worldLoad.loaded) {
      this.say = send
      return send(message)
    }

    if (typeof message === 'string' && !message.startsWith('§9')) message = '§9│ ' + message.replace(/\n/g, '\n§9│ §r')

    send(message)
  },
  overworld: world.getDimension(MinecraftDimensionTypes.Overworld),
  nether: world.getDimension(MinecraftDimensionTypes.Nether),
  end: world.getDimension(MinecraftDimensionTypes.TheEnd),
  debug(...data: unknown[]) {
    this.say(data.map(stringify).join(' '))
  },

  logOnce(name, ...data: unknown[]) {
    if (logs.has(name)) return
    world.debug(...data)
    logs.add(name)
  },
})

const logs = new Set()
