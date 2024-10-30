import { Player, system } from '@minecraft/server'
import { InventoryStore } from 'lib/database/inventory'
import { CURRENT_BUILDERS, isBuilding } from 'lib/game-utils'
import { Join } from 'lib/player-join'

const builderInventory = new InventoryStore('build2')

Join.onMoveAfterJoin.subscribe(({ player }) => {
  // First time set
  setBuildingTip(player, CURRENT_BUILDERS.has(player.id))
})

system.runPlayerInterval(updateBuilderStatus, 'builder list update', 10)

// Insert role value right after name
// PlayerNameTagModifiers.push(p => isBuilding(p) && `\n${getFullname(p.id, { name: false })}`)

export function updateBuilderStatus(player: Player) {
  const isBuilder = isBuilding(player, true)
  const onList = CURRENT_BUILDERS.has(player.id)

  if (isBuilder && !onList) {
    switchInv()
    setBuildingTip(player, true)
    CURRENT_BUILDERS.add(player.id)
  } else if (!isBuilder && onList) {
    switchInv()
    setBuildingTip(player, false)
    CURRENT_BUILDERS.delete(player.id)
  }

  function switchInv() {
    const invToLoad = builderInventory.get(player.id, {
      fallback: { equipment: {}, health: 20, slots: {}, xp: 0 },
    })

    builderInventory.saveFrom(player, {
      rewrite: true,
      keepInventory: true,
    })

    InventoryStore.load({
      from: invToLoad,
      clearAll: true,
      to: player,
    })
  }
}

function setBuildingTip(player: Player, value = true) {
  player.onScreenDisplay.setTip(1, value ? 'Режим стройки' : '')
}
