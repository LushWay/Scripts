import { system, world } from '@minecraft/server'
import { onLoad } from 'lib/utils/load-ref'

const message = `§9> §fDone in §6${((Date.now() - globalThis.loaded) / 1000).toFixed(2)}§f sec`

system.delay(() => {
  console.info(message)
  if (!__RELEASE__) world.say(message)

  if (__GIT__)
    import('lib/roles').then(({ is }) => {
      onLoad(() => {
        for (const player of world.getAllPlayers())
          if (is(player.id, 'techAdmin')) player.tell(`§sCommit: §f${__GIT__.replace(/^Commit: /, '')}`)
      })
    })

  globalThis.loaded = 0
})
