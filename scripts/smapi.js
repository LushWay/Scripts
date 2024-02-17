import { system, world } from '@minecraft/server'

// This need to be loaded before all another scripts
import 'lib/watchdog.js'
// Extended script features
import 'lib/Extensions/import.js'

import { EventLoader } from 'lib/EventSignal.js'
import { util } from 'lib/util.js'
import { CONFIG } from './config.js'
import importModules from './modules/importModules.js'

// Can be removed on release
world.say('§9┌ §fLoading...')
const loading = Date.now()

export * from 'lib/Command/index.js'

// Class
export * from 'lib/Action.js'
export * from 'lib/Airdrop.js'
export * from 'lib/Boss.js'
export * from 'lib/Cooldown.js'
export * from 'lib/EditableLocation.js'
export * from 'lib/Enchantments.js'
export * from 'lib/EventSignal.js'
export * from 'lib/GameUtils.js'
export * from 'lib/Leaderboard.js'
export * from 'lib/LootTable.js'
export * from 'lib/Net.js'
export * from 'lib/OptionalModules.js'
export * from 'lib/Quest.js'
export * from 'lib/Search.js'
export * from 'lib/Settings.js'
export * from 'lib/Sidebar.js'
export * from 'lib/StoredRequest.js'
export * from 'lib/Temporary.js'
export * from 'lib/Zone.js'

// Region
export * from 'lib/Region/index.js'
// Database
export * from 'lib/Database/Default.js'
export * from 'lib/Database/Inventory.js'
export * from 'lib/Database/Player.js'
// Form
export * from 'lib/Form/ActionForm.js'
export * from 'lib/Form/ChestForm.js'
export * from 'lib/Form/MessageForm.js'
export * from 'lib/Form/ModalForm.js'
export * from 'lib/Form/NpcForm.js'
export * from 'lib/Form/utils.js'
// Setup
export * from 'lib/Extensions/OverTakes.js'
export * from 'lib/Extensions/import.js'
export * from 'lib/Extensions/itemstack.js'
export * from 'lib/Extensions/system.js'
export * from 'lib/roles.js'
export * from 'lib/util.js'

world.afterEvents.playerJoin.subscribe(player => {
  if (Date.now() - loading < CONFIG.firstPlayerJoinTime && player.playerId === CONFIG.singlePlayerHostId) {
    util.settings.firstLoad = true
  }
})

system.run(async function waiter() {
  const entities = await world.overworld.runCommandAsync(`testfor @e`)
  if (entities.successCount < 1) {
    // No entity found, we need to re-run this...
    return system.run(waiter)
  }

  try {
    console.log('§6Script working')
    EventLoader.load(SM.afterEvents.worldLoad)

    if (world.getAllPlayers().find(e => e.id === CONFIG.singlePlayerHostId)) {
      util.settings.BDSMode = false
    }

    await importModules()

    EventLoader.load(SM.afterEvents.modulesLoad)

    world.say(
      `${util.settings.firstLoad ? '§fFirst loaded in ' : '§9└ §fDone in '}${((Date.now() - loading) / 1000).toFixed(
        2
      )}`
    )
  } catch (e) {
    util.error(e, { errorName: 'LoadError' })
  }
})

system.afterEvents.scriptEventReceive.subscribe(
  data => {
    if (data.id === 'SERVER:SAY') {
      world.say(decodeURI(data.message))
    }
  },
  {
    namespaces: ['SERVER'],
  }
)
