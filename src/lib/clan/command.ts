import { clanMenu } from './menu'

new Command('clan').setDescription('Клан').executes(ctx => clanMenu(ctx.player)[1]())
