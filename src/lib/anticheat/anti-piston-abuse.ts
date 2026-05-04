import { system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib/vector'
import { antiCheatLog } from './log-provider'
import { noI18n } from 'lib/i18n/text'

world.afterEvents.pistonActivate.subscribe(event => {
  const locations = event.piston.getAttachedBlocksLocations()

  system.runTimeout(
    () => {
      if (!event.block.isValid) return

      for (const location of locations) {
        const block = event.block.dimension.getBlock(location)
        if (block?.typeId !== MinecraftBlockTypes.Hopper) continue

        const nearbyPlayers = event.block.dimension.getPlayers({ location: event.block.location, maxDistance: 20 })
        const nearbyPlayersNames = nearbyPlayers.map(e => e.name).join('\n')

        antiCheatLog(noI18n`ПОРШЕНЬ ДЮП ${Vec.string(event.block.location)}\n${nearbyPlayersNames}`)

        event.block.dimension.createExplosion(event.block.location, 5, { breaksBlocks: true })
        return
      }
    },
    'piston dupe prevent',
    2,
  )
})
