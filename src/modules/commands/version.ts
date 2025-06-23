import { is } from 'lib'
import { t, textTable } from 'lib/text'

new Command('version')
  .setAliases('v')
  .setDescription(t`Версия сервера`)
  .executes(ctx => {
    ctx.reply(
      textTable({
        'Версия майнкрафта': '1.21.2',
        'Версия сервера': '1.21.3',
      }),
    )

    if (is(ctx.player.id, 'techAdmin')) {
      ctx.reply(
        textTable({
          Commit: __GIT__,
          Development: __DEV__,
          Release: __RELEASE__,
        }),
      )
    }
  })
