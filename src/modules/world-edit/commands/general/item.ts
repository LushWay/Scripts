const root = new Command('item').setDescription('Управляет предметом в руке').setPermissions('admin').setGroup('test')

root
  .overload('lore')
  .setAliases('l')
  .setDescription('Задает лор предмета')
  .string('lore')
  .executes(ctx => {
    const item = ctx.player.mainhand()
    const oldlore = item.getLore()
    item.setLore(ctx.args)
    ctx.player.success(`§a► §f${oldlore} ► ${item.getLore()}`)
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
    ctx.player.success(`§f${oldtag ?? ''} ► ${item.nameTag}`)
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
    ctx.player.success(`§f${oldamount} ► ${item.amount}`)
  })

const damage = root
  .overload('damage')
  .setDescription('Показывает состояние поломанности предмета')
  .executes(ctx => {
    const slot = ctx.player.mainhand()
    const item = slot.getItem()
    if (!item?.durability) return ctx.error('No damage component on item')

    ctx.player.success(`${item.durability.maxDurability - item.durability.damage}/${item.durability.maxDurability}`)
  })

damage
  .int('count')
  .setDescription('Задает уровень поломанности предмета')
  .executes((ctx, damage) => {
    const slot = ctx.player.mainhand()
    const item = slot.getItem()
    if (!item?.durability) return ctx.error('No damage component on item')
    if (damage > item.durability.maxDurability) {
      return ctx.error(`Damage is bigger then max. ${damage}/${item.durability.maxDurability}`)
    }

    item.durability.damage = damage
    slot.setItem(item)
    ctx.player.success(`${damage}/${item.durability.maxDurability}`)
  })

new Command('dupe')
  .setPermissions('techAdmin')
  .setDescription('Дюпает предмет')
  .executes(ctx => {
    const slot = ctx.player.mainhand()
    const item = slot.getItem()
    if (!item) return ctx.error('Нечего дюпать!')

    ctx.player.container?.addItem(item)
    ctx.player.success('Успешно!')
  })
