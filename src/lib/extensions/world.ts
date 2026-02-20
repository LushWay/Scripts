import { Dimension, World, world } from '@minecraft/server'
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data'
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

    overworld: Dimension
    end: Dimension
    nether: Dimension
  }
}

world.afterEvents.worldLoad.subscribe(() => {
  expand(World.prototype, {
    overworld: world.getDimension(MinecraftDimensionTypes.Overworld),
    nether: world.getDimension(MinecraftDimensionTypes.Nether),
    end: world.getDimension(MinecraftDimensionTypes.TheEnd),
  })
})

expand(World.prototype, {
  say: world.sendMessage.bind(world),
  get overworld() {
    // throw new Error('Dimensions are not available')
    return undefined as unknown as Dimension
  },
  get nether() {
    // throw new Error('Dimensions are not available')
    return undefined as unknown as Dimension
  },
  get end() {
    // throw new Error('Dimensions are not available')
    return undefined as unknown as Dimension
  },
  logOnce(name, ...data: unknown[]) {
    if (logs.has(name)) return
    console.log(name, ...data)
    logs.add(name)
  },
})

const logs = new Set()
