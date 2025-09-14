import { system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib'

world.afterEvents.pistonActivate.subscribe(event => {
  const blocks = event.piston.getAttachedBlocksLocations()

  system.runTimeout(
    () => {
      if (!event.block.isValid) return
      for (const blockl of blocks) {
        const block = event.block.dimension.getBlock(blockl)
        if (block?.typeId === MinecraftBlockTypes.Hopper) {
          const nearbyPlayers = event.block.dimension.getPlayers({ location: event.block.location, maxDistance: 20 })
          console.warn(
            `PISTON DUPE DETECTED!!! ${Vec.string(event.block.location)}\n${nearbyPlayers.map(e => e.name).join('\n')}`,
          )
          event.block.dimension.createExplosion(event.block.location, 1, { breaksBlocks: true })
          return
        }
      }
    },
    'piston dupe prevent',
    2,
  )
})
