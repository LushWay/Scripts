import { system, world } from '@minecraft/server'

// This need to be loaded before all another scripts
import './lib/watchdog.js'

import './lib/Extensions/import.js'

import { CONFIG } from './config.js'
import { EventLoader } from './lib/Class/EventSignal.js'
import { util } from './lib/util.js'
import importModules from './modules/importModules.js'

world.say('§9┌ §fLoading...')
const loading = Date.now()

export * from 'lib/Command/index.js'

// Class
export * from './lib/Class/Action.js'
export * from './lib/Class/Airdrop.js'
export * from './lib/Class/Boss.js'
export * from './lib/Class/Cooldown.js'
export * from './lib/Class/EditableLocation.js'
export * from './lib/Class/Enchantments.js'
export * from './lib/Class/EventSignal.js'
export * from './lib/Class/GameUtils.js'
export * from './lib/Class/Leaderboard.js'
export * from './lib/Class/LootTable.js'
export * from './lib/Class/Net.js'
export * from './lib/Class/OptionalModules.js'
export * from './lib/Class/Portals.js'
export * from './lib/Class/Quest.js'
export * from './lib/Class/Search.js'
export * from './lib/Class/Settings.js'
export * from './lib/Class/Sidebar.js'
export * from './lib/Class/StoredRequest.js'
export * from './lib/Class/Temporary.js'
export * from './lib/Class/Zone.js'

// Region
export * from './lib/Region/index.js'
// Database
export * from './lib/Database/Default.js'
export * from './lib/Database/Inventory.js'
export * from './lib/Database/Player.js'
// Form
export * from './lib/Form/ActionForm.js'
export * from './lib/Form/MessageForm.js'
export * from './lib/Form/ModalForm.js'
export * from './lib/Form/utils.js'
// Setup
export * from './lib/Extensions/OverTakes.js'
export * from './lib/Extensions/import.js'
export * from './lib/Extensions/itemstack.js'
export * from './lib/Extensions/system.js'
export * from './lib/roles.js'
export * from './lib/util.js'

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
