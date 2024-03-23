new Command({
  name: 'discord',
  description: '§9Discord§7 сервер: §bdsc.gg/lushway',
  requires: () => true,
}).executes(ctx => {
  ctx.reply('§9Discord§7 сервер: §bdsc.gg/lushway')
})
