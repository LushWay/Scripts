import { world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib/vector'
import { antiCheatLog } from './log-provider'

world.afterEvents.entitySpawn.subscribe(event => {
  const { entity } = event

  if (entity.typeId !== MinecraftEntityTypes.Wither) return

  const { location } = entity
  const block = entity.dimension.getBlock(location)

  if (block?.typeId !== MinecraftBlockTypes.Bedrock) return

  const nearbyPlayers = event.entity.dimension.getPlayers({ location, maxDistance: 20 })
  const nearbyPlayersNames = nearbyPlayers.map(e => e.name).join('\n')

  antiCheatLog(`ОБНАРУЖЕН АБУЗ ВИЗЕРА ${Vec.string(location)}\n${nearbyPlayersNames}`)

  entity.remove()
})
