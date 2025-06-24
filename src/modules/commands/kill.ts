import { LockAction } from 'lib/action'
import { t } from 'lib/i18n/text'

new Command('kill').setDescription(t`Убивает вас. Используйте, если застряли где-то`).executes(ctx => {
  if (LockAction.locked(ctx.player)) return

  ctx.player.kill()
})
