import { EventLoader } from '../Class/EventSignal.js'

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
