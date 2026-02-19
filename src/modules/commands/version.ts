import { i18n, textTable } from 'lib/i18n/text'
import { is } from 'lib/roles'

new Command('version')
  .setAliases('v')
  .setDescription(i18n`Версия сервера`)
  .executes(ctx => {
    ctx.reply(
      textTable([
        [i18n`Версия майнкрафта`, '1.21.2'],
        [i18n`Версия сервера`, '1.21.3'],
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
