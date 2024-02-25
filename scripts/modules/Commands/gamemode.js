new Command({
  name: 's',
  description: 'Выживание',
  role: 'builder',
}).executes(ctx => {
  ctx.sender.runCommand('gamemode s')
  ctx.sender.success('§aS')
})

new Command({
  name: 'c',
  aliases: ['с', 'gm1'],
  description: 'Креатив',
  role: 'builder',
}).executes(ctx => {
  ctx.sender.runCommand('gamemode c')
})
