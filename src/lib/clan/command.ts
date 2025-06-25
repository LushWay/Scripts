import { i18n } from 'lib/i18n/text'
import { clanMenu } from './menu'

new Command('clan')
  .setDescription(i18n`Клан`)
  .setPermissions('member')
  .executes(ctx => clanMenu(ctx.player)[1]())
