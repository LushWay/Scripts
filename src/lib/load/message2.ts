import { system, world } from '@minecraft/server'

const message = `§9> §fDone in §6${((Date.now() - globalThis.loaded) / 1000).toFixed(2)}§f sec`

system.delay(() => {
  console.info(message)
  if (!__RELEASE__) world.say(message)

  import('lib/roles').then(({ is }) => {
    for (const player of world.getAllPlayers()) if (is(player.id, 'techAdmin')) player.tell(`§sCommit: §f${__GIT__}`)
  })

  globalThis.loaded = 0
})
