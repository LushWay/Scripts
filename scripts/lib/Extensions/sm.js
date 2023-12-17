import { EventLoader } from '../Class/EventSignal.js'
import { Command } from '../Command/index.js'

/**
 * Class because variable hoisting
 */
class SM {
  static afterEvents = {
    modulesLoad: new EventLoader(),
    worldLoad: new EventLoader(),
  }
}
globalThis.SM = SM
globalThis.Command = Command
