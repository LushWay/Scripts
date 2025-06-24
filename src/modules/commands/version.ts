import { is } from 'lib'
import { t, textTable } from 'lib/i18n/text'

new Command('version')
  .setAliases('v')
  .setDescription(t`Версия сервера`)
  .executes(ctx => {
    ctx.reply(
      textTable([
        [t`Версия майнкрафта`, '1.21.2'],
        [t`Версия сервера`, '1.21.3'],
      ]),
    )

    if (is(ctx.player.id, 'techAdmin')) {
      ctx.reply(
        textTable([
          ['Commit', __GIT__],
          ['Development', __DEV__],
          ['Release', __RELEASE__],
        ]),
      )
    }
  })
