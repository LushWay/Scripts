import { system, world } from '@minecraft/server'

// This need to be loaded before all another scripts
import './lib/watchdog.js'

import './lib/Extensions/import.js'

import { CONFIG } from './config.js'
import { EventLoader } from './lib/Class/Events.js'
import { XCommand } from './lib/Command/index.js'
import { util } from './lib/util.js'
import importModules from './modules/importModules.js'

world.say('§9┌ §fLoading...')
const loading = Date.now()

/**
 * Class because variable hoisting
 */
export class XA {
  static afterEvents = {
    modulesLoad: new EventLoader(),
    databaseInit: new EventLoader(),
    worldLoad: new EventLoader(),
  }
}

globalThis.XA = XA
globalThis.XCommand = XCommand

// Class
export * from './lib/Class/Action.js'
export * from './lib/Class/Cooldown.js'
export * from './lib/Class/Events.js'
export * from './lib/Class/Options.js'
export * from './lib/Class/Utils.js'
// Command
export * from './lib/Command/index.js'
// Database
export * from './lib/Database/Default.js'
export * from './lib/Database/Inventory.js'
export * from './lib/Database/Player.js'
export * from './lib/Database/Scoreboard.js'
// Form
export * from './lib/Form/ActionForm.js'
export * from './lib/Form/MessageForm.js'
export * from './lib/Form/ModalForm.js'
export * from './lib/Form/utils.js'
// Setup
export * from './lib/Extensions/import.js'
export * from './lib/Extensions/system.js'
export * from './lib/roles.js'
export * from './lib/util.js'

world.afterEvents.playerJoin.subscribe(player => {
  if (
    Date.now() - loading < CONFIG.firstPlayerJoinTime &&
    player.playerId === '-4294967285'
  ) {
    util.settings.firstLoad = true
  }
})

importModules()

system.run(async function waiter() {
  const entities = await world.overworld.runCommandAsync(`testfor @e`)
  if (entities.successCount < 1) {
    // No entity found, we need to re-run this...
    return system.run(waiter)
  }

  try {
    console.log('§6Script working')
    EventLoader.load(XA.afterEvents.worldLoad)

    if (world.getAllPlayers().find(e => e.id === '-4294967285')) {
      util.settings.BDSMode = false
    }

    world.say(
      `${util.settings.firstLoad ? '§fFirst loaded in ' : '§9└ §fDone in '}${(
        (Date.now() - loading) /
        1000
      ).toFixed(2)}`,
    )
  } catch (e) {
    util.error(e, { errorName: 'LoadError' })
  }
})
