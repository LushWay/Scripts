import { world } from '@minecraft/server'

if (__GIT__) console.info('§7' + __GIT__)

const message = '§9> §fReloading script...'
if (!__VITEST__) console.info(message)
if (!__RELEASE__) world.say(message)
