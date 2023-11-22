import importModules from 'modules/importModules.js'
import './Commands/gamemode.js'
import './Commands/help.js'
import './Commands/inv.js'
import './Commands/name.js'
import './Commands/ping.js'
import './Commands/role.js'
import './Commands/settings.js'
import './Commands/sit.js'
import './Commands/tp.js'
import { SERVER } from './var.js'

let toImport = './disabled.js'
if (SERVER.type === 'build') toImport = '../Gameplay/Build/index.js'
if (SERVER.type === 'survival') toImport = '../Gameplay/Survival/index.js'

importModules({
  array: [toImport],
  fn: m => import(m),
})
