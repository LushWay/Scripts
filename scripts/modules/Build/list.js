import { Player, system, world } from '@minecraft/server'
import { PLAYER_NAME_TAG_MODIFIERS } from 'modules/Indicator/playerNameTag.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { InventoryStore, OverTakes, ROLES, getRole } from 'smapi.js'

const propname = 'onlineBuilderList'
const list = world.getDynamicProperty(propname)

/**
 * @type {Set<string>}
 */
const onlineBuildersList = new Set()

if (typeof list === 'string') {
  /** @type {string[]} */
  const arr = JSON.parse(list)

  arr.forEach(onlineBuildersList.add.bind(onlineBuildersList))
}

function saveList() {
  world.setDynamicProperty(propname, JSON.stringify([...onlineBuildersList]))
}

OverTakes(onlineBuildersList, {
  add(...args) {
    super.add(...args)
    saveList()
    return this
  },
  delete(...args) {
    const r = super.delete(...args)
    saveList()
    return r
  },
})

/**
 * @param {Player} player
 */
export function isBuilding(player, uptodate = false) {
  if (uptodate) return player.isGamemode('creative')
  return onlineBuildersList.has(player.id)
}

const builderInventory = new InventoryStore('build')

Join.onMoveAfterJoin.subscribe(({ player }) => {
  // First time set
  system.delay(() => {
    setBuildingTip(player, onlineBuildersList.has(player.id))
  })
})

system.runPlayerInterval(
  player => {
    const creative = player.isGamemode('creative')
    const builder = onlineBuildersList.has(player.id)

    if (creative && !builder) {
      switchInv()
      setBuildingTip(player, true)
      onlineBuildersList.add(player.id)
    } else if (!creative && builder) {
      switchInv()
      setBuildingTip(player, false)
      onlineBuildersList.delete(player.id)
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
  10
)

// Insert role value right after name
PLAYER_NAME_TAG_MODIFIERS.splice(1, 0, p => isBuilding(p) && `\n${ROLES[getRole(p.id)]}`)

/**
 * @param {Player} player
 */
function setBuildingTip(player, value = true) {
  player.onScreenDisplay.setTip(1, value ? 'Режим стройки' : '')
}
