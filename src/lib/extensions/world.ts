import { MinecraftDimensionTypes, World, world } from '@minecraft/server'
import { util } from '../util'
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
    this.say(data.map(e => (typeof e === 'string' ? e : util.inspect(e))).join(' '))
  },

  logOnce(name, ...data: unknown[]) {
    if (logs.has(name)) return
    world.debug(...data)
    logs.add(name)
  },
})

const logs = new Set()
