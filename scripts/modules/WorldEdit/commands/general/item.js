import { EquipmentSlot } from '@minecraft/server'

const root = new Command({
  name: 'item',
  description: 'Управляет предметом в руке',
  role: 'moderator',
  type: 'test',
})

root
  .literal({ name: 'lore', aliases: ['l'], description: 'Задает лор предмета' })
  .string('lore')
  .executes(ctx => {
    const item = ctx.sender.mainhand()
    if (!item) return ctx.reply('§cВ руке нет предмета!')
    const oldtag = item.getLore()
    item.setLore(ctx.args)
    ctx.reply(`§a► §f${oldtag ?? ''} ► ${item.getLore()}`)
  })

root
  .literal({ name: 'name', aliases: ['n'], description: 'Задает имя предмета' })
  .string('name')
  .executes((ctx, name) => {
    const item = ctx.sender.mainhand()
    if (!item) return ctx.reply('§cВ руке нет предмета!')
    const oldtag = item.nameTag
    item.nameTag = name
    ctx.reply(`§a► §f${oldtag ?? ''} ► ${item.nameTag}`)
  })
root
  .literal({
    name: 'count',
    aliases: ['c'],
    description: 'Задает количество предметов',
  })
  .int('count')
  .executes((ctx, count) => {
    const item = ctx.sender.getComponent('equippable').getEquipmentSlot(EquipmentSlot.Mainhand)
    if (!item) return ctx.reply('§cВ руке нет предмета!')
    const oldtag = item.amount
    item.amount = count
    ctx.reply(`§a► §f${oldtag ?? ''} ► ${item.amount}`)
  })
