import { t } from 'lib/text'
import { clanMenu } from './menu'

new Command('clan')
  .setDescription(t`Клан`)
  .setPermissions('member')
  .executes(ctx => clanMenu(ctx.player)[1]())
