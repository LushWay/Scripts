import { Player, system } from '@minecraft/server'
import { Join } from 'lib/PlayerJoin'
import { InventoryStore } from 'lib/database/inventory'
import { ROLES, getRole } from 'lib/roles'
import { PLAYER_NAME_TAG_MODIFIERS } from 'modules/Indicator/playerNameTag'
import { CURRENT_BUILDERS, isBuilding } from '../../isBuilding'

const builderInventory = new InventoryStore('build')

Join.onMoveAfterJoin.subscribe(({ player }) => {
  // First time set
  setBuildingTip(player, CURRENT_BUILDERS.has(player.id))
})

system.runPlayerInterval(
  player => {
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
  },
  'builder list update',
  10,
)

// Insert role value right after name

// @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
PLAYER_NAME_TAG_MODIFIERS.splice(1, 0, p => isBuilding(p) && `\n${ROLES[getRole(p.id)]}`)

/** @param {Player} player */
function setBuildingTip(player, value = true) {
  player.onScreenDisplay.setTip(1, value ? 'Режим стройки' : '')
}
