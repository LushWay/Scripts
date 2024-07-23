/* eslint-disable @typescript-eslint/use-unknown-in-catch-callback-variable */
import { request } from 'lib/bds/api'
import { stringify } from 'lib/utils/inspect'

new Command('backup')
  .setPermissions('techAdmin')
  .string('name', true)
  .executes((ctx, name = 'InWorldBackup') => {
    ctx.reply('§6> §rПринято.')
    request('backup', { name })
      .then(s => ctx.player.tell(s.statusMessage))
      .catch(e => {
        console.error(e)
        ctx.player.fail(stringify(e))
      })
  })
