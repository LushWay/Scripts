import { LockAction } from 'lib/action'
import { i18n } from 'lib/i18n/text'

new Command('kill').setDescription(i18n`Убивает вас. Используйте, если застряли где-то`).executes(ctx => {
  if (LockAction.locked(ctx.player)) return

  ctx.player.kill()
})
