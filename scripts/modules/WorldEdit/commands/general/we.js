import { WEMenu } from '../../menu.js'

new Command({
  name: 'we',
  aliases: ['wb', 'wa'],
  role: 'builder',
  description: 'Открывает меню редактора мира',
}).executes(ctx => WEMenu(ctx.sender))
