import { Player, system, world } from '@minecraft/server'
import { InventoryStore } from 'lib/database/inventory'
import { Join } from 'lib/player-join'
import { CURRENT_BUILDERS, isNotPlaying } from 'lib/utils/game'

const builderInventory = new InventoryStore('build2')

Join.onMoveAfterJoin.subscribe(({ player }) => {
  // First time set
  setBuildingTip(player, CURRENT_BUILDERS.has(player.id))
})

system.runPlayerInterval(updateBuilderStatus, 'builder list update', 10)

world.afterEvents.playerGameModeChange.subscribe(event => {
  updateBuilderStatus(event.player)
})

// Insert role value right after name
// PlayerNameTagModifiers.push(p => isBuilding(p) && `\n${getFullname(p.id, { name: false })}`)

export function updateBuilderStatus(player: Player) {
  const building = isNotPlaying(player, true)
  const onList = CURRENT_BUILDERS.has(player.id)

  if (building && !onList) {
    switchInv()
    setBuildingTip(player, true)
    CURRENT_BUILDERS.add(player.id)
  } else if (!building && onList) {
    switchInv()
    setBuildingTip(player, false)
    CURRENT_BUILDERS.delete(player.id)
  }

  function switchInv() {
    const invToLoad = builderInventory.get(player.id) ?? { equipment: {}, health: 20, slots: {}, xp: 0 }
    builderInventory.set(player, InventoryStore.getFrom(player, { enderChest: true }))
    InventoryStore.load({ from: invToLoad, to: player, enderChest: true })
  }
}

function setBuildingTip(player: Player, value = true) {
  player.onScreenDisplay.setTip(1, value ? 'Режим стройки' : '')
}
