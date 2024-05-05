import { WEmenu } from '../../menu.js'

new Command('we')
  .setAliases('wb', 'wa')
  .setPermissions('builder')
  .setDescription('Открывает меню редактора мира')
  .executes(ctx => WEmenu(ctx.player))
