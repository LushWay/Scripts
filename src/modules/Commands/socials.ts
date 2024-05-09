// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('discord')
  .setDescription('§9Discord§7 сервер: §bdsc.gg/lushway')
  .setPermissions('everybody')
  .executes(ctx => {
    ctx.reply('§9Discord§7 сервер: §bdsc.gg/lushway')
  })
