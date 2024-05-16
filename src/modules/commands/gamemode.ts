import { GameMode } from '@minecraft/server'

new Command('s')
  .setDescription('Выживание')
  .setPermissions('builder')
  .executes(ctx => {
    ctx.player.setGameMode(GameMode.survival)
    ctx.player.success('§aS')
  })

new Command('c')
  .setAliases('с', 'gm1')
  .setDescription('Креатив')
  .setPermissions('builder')
  .executes(ctx => {
    ctx.player.setGameMode(GameMode.creative)
  })
