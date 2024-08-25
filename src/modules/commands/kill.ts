import { LockAction } from 'lib/action'

new Command('kill').setDescription('Убивает вас. Используйте, если застряли где-то').executes(ctx => {
  if (LockAction.locked(ctx.player)) return

  ctx.player.kill()
})
