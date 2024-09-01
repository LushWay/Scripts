import { Player, world } from '@minecraft/server'
import { playerJson, PlayerProperties } from 'lib/assets/player-json'

export function setMinimapEnabled(player: Player, status: boolean) {
  player.setProperty(PlayerProperties['lw:minimap'], status)
}

export enum MinimapNpc {
  Airdrop = 1,
  Quest = 2,
}

export function setMinimapNpcPosition(player: Player, npc: MinimapNpc, x: number, z: number) {
  try {
    // console.debug('Setting minimap to', x, z)
    player.setProperty(PlayerProperties[`lw:minimap_npc_${npc}_x`], x)
    player.setProperty(PlayerProperties[`lw:minimap_npc_${npc}_z`], z)
  } catch (error) {
    console.error('Unable to set minimap npc', npc, 'for x', x, 'and z', z, error)
  }
}

const min = playerJson['minecraft:entity'].description.properties['lw:minimap_npc_1_x'].range[0]

export function resetMinimapNpcPosition(player: Player, npc: MinimapNpc) {
  return setMinimapNpcPosition(player, npc, min, min)
}

world.afterEvents.playerSpawn.subscribe(event => {
  if (!event.initialSpawn) return

  resetAllMinimaps(event.player)
})

world.getAllPlayers().forEach(resetAllMinimaps)

function resetAllMinimaps(player: Player) {
  resetMinimapNpcPosition(player, MinimapNpc.Airdrop)
  resetMinimapNpcPosition(player, MinimapNpc.Quest)
}
