import { clanMenu } from './menu'

new Command('clan')
  .setDescription('Клан')
  .setPermissions('member')
  .executes(ctx => clanMenu(ctx.player)[1]())
