new Command({
  name: 's',
  description: 'Выживание',
  role: 'builder',
}).executes(ctx => {
  ctx.sender.runCommand('gamemode s')
  ctx.reply('§a► S')
})

new Command({
  name: 'c',
  description: 'Креатив',
  role: 'builder',
}).executes(ctx => {
  ctx.sender.runCommand('gamemode c')
})
