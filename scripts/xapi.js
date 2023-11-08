import { Player, system, world } from '@minecraft/server'

// This need to be loaded before all another scripts
import './lib/watchdog.js'

import './lib/Extensions/import.js'

import { CONFIG } from './config.js'
import { EventLoader } from './lib/Class/Events.js'
import { XCommand } from './lib/Command/index.js'
import { Database } from './lib/Database/Rubedo.js'
import { OverTakes } from './lib/Extensions/import.js'
import { emoji } from './lib/Lang/emoji.js'
import { text } from './lib/Lang/text.js'
import { util } from './lib/util.js'
import importModules from './modules/import.js'

world.say('§9┌ §fLoading...')
const loading = Date.now()

/**
 * Class because variable hoisting
 */
export class XA {
  static lang = {
    lang: text,
    emoji: emoji,
  }

  static tables = {
    /**
     * Database to store any player data
     * @type {Database<string, any>}
     */
    player: new Database('player'),
  }

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
export * from './lib/Database/Rubedo.js'
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

  const errorName = 'LoadError'
  try {
    console.log('§6Script working')
    EventLoader.load(XA.afterEvents.worldLoad)

    // errorName = "DatabaseError";
    // await Database.initAllTables();
    // EventLoader.load(XA.afterEvents.databaseInit);

    // errorName = "ModuleError";
    // await importModules();
    // EventLoader.load(XA.afterEvents.modulesLoad);

    if (world.getAllPlayers().find(e => e.id === '-4294967285')) {
      util.settings.BDSMode = false
    }

    world.say(
      `${util.settings.firstLoad ? '§fFirst loaded in ' : '§9└ §fDone in '}${(
        (Date.now() - loading) /
        1000
      ).toFixed(2)}`
    )
  } catch (e) {
    util.error(e, { errorName })
  }
})

XA.afterEvents.databaseInit.subscribe(() => {
  OverTakes(Player.prototype, {
    db() {
      return XA.tables.player.work(super.id)
    },
  })

  OverTakes(Player, {
    name(id) {
      return XA.tables.player.get(id)?.name
    },
  })
})
