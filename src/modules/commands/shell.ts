/* i18n-ignore */
import { sendPacketToStdout } from 'lib/bds/api'

new Command('backup')
  .setPermissions('techAdmin')
  .string('name', true)
  .executes(ctx => {
    ctx.reply('§6> §rПринято.')
    sendPacketToStdout('createBackup', { name: ctx.input || 'InWorldBackup' })
  })
