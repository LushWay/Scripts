
new Command('s')
  .setDescription('Выживание')
  .setPermissions('builder')
  .executes(ctx => {
    ctx.player.runCommand('gamemode s')
    ctx.player.success('§aS')
  })


new Command('c')
  .setAliases('с', 'gm1')
  .setDescription('Креатив')
  .setPermissions('builder')
  .executes(ctx => {
    ctx.player.runCommand('gamemode c')
  })
