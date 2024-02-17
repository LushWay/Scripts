import { EventLoader } from '../EventSignal.js'

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
