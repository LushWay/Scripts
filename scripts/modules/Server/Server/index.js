import importModules from 'modules/importModules.js'
import './commands/gamemode.js'
import './commands/ping.js'
import './commands/sit.js'
import { SERVER } from './var.js'

let toImport = './disabled.js'
if (SERVER.type === 'build') toImport = '../../Gameplay/Build/index.js'
if (SERVER.type === 'survival') toImport = '../../Gameplay/Survival/index.js'

importModules({ array: [toImport], fn: m => import(m) })
