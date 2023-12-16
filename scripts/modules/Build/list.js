import { Player, system, world } from '@minecraft/server'
import { InventoryStore, OverTakes } from 'smapi.js'

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

system.runPlayerInterval(
  player => {
    const creative = player.isGamemode('creative')
    const builder = onlineBuildersList.has(player.id)

    if (creative && !builder) {
      switchInv()
      onlineBuildersList.add(player.id)
    } else if (!creative && builder) {
      switchInv()
      onlineBuildersList.delete(player.id)
    }

    function switchInv() {
      const invToLoad = builderInventory.getEntityStore(player.id, {
        fallback: { equipment: {}, health: 20, slots: {}, xp: 0 },
      })

      builderInventory.saveFromEntity(player, {
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
