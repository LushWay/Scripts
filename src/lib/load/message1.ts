import { world } from '@minecraft/server'

const message = '§9┌ §fReloading script...'
if (!__VITEST__) console.log(message)
if (!__RELEASE__) world.say(message)
