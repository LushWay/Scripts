import { WEmenu } from '../../menu'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('we')
  .setAliases('wb', 'wa')
  .setPermissions('builder')
  .setDescription('Открывает меню редактора мира')
  .executes(ctx => WEmenu(ctx.player))
