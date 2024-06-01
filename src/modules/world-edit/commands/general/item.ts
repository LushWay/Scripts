const root = new Command('item').setDescription('Управляет предметом в руке').setPermissions('admin').setGroup('test')

root
  .overload('lore')
  .setAliases('l')
  .setDescription('Задает лор предмета')
  .string('lore')
  .executes(ctx => {
    const item = ctx.player.mainhand()
    const oldlore = item.getLore()
    item.setLore(ctx.arguments)
    ctx.reply(`§a► §f${oldlore} ► ${item.getLore()}`)
  })

root
  .overload('name')
  .setAliases('n')
  .setDescription('Задает имя предмета')
  .string('name')
  .executes((ctx, name) => {
    const item = ctx.player.mainhand()
    const oldtag = item.nameTag
    item.nameTag = name
    ctx.reply(`§a► §f${oldtag ?? ''} ► ${item.nameTag}`)
  })
root
  .overload('count')
  .setAliases('c')
  .setDescription('Задает количество предметов')
  .int('count')
  .executes((ctx, count) => {
    const item = ctx.player.mainhand()
    const oldamount = item.amount
    item.amount = count
    ctx.reply(`§a► §f${oldamount} ► ${item.amount}`)
  })
