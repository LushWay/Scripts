import { Player, world } from '@minecraft/server'
import { playerJson } from 'lib/assets/generated'
import { PlayerProperties } from 'lib/assets/player-properties'

export function setMinimapEnabled(player: Player, status: boolean) {
  player.setProperty(PlayerProperties['lw:minimap'], status)
}

type NpcN = 1 | 2

export function setMinimamNpcPosition(player: Player, npc: NpcN, x: number, z: number) {
  try {
    console.debug('Setting minimap to', x, z)
    player.setProperty(PlayerProperties[`lw:minimap_npc_${npc}_x`], x)
    player.setProperty(PlayerProperties[`lw:minimap_npc_${npc}_z`], z)
  } catch (error) {
    console.error('Unable to set minimap npc', npc, 'for x', x, 'and z', z, error)
  }
}

const min = playerJson['minecraft:entity'].description.properties['lw:minimap_npc_1_x'].range[0]

export function resetMinimapNpcPosition(player: Player, npc: NpcN) {
  return setMinimamNpcPosition(player, npc, min, min)
}

world.afterEvents.playerSpawn.subscribe(event => {
  if (!event.initialSpawn) return

  resetMinimapNpcPosition(event.player, 1)
  resetMinimapNpcPosition(event.player, 2)
})
