import {} from '@minecraft/server'
import { Vector, util } from 'lib'

const root = new Command('id').setDescription('Выдает айди').setPermissions('builder').setGroup('we')

root.executes(ctx => {
  const item = ctx.player.mainhand()
  if (!item) return ctx.reply('§cВ руке нет предмета!')

  ctx.reply(`§b► §f${item?.typeId?.replace('minecraft:', '')} ${item?.nameTag ? `(${item?.nameTag}) ` : ''}`)
})

root
  .overload('l')
  .setDescription('Выдает id блока по локации')
  .location('location', true)
  .executes((ctx, location) => {
    const l = Vector.floor(location)
    const block = ctx.player.dimension.getBlock(l)
    if (!block) return ctx.reply('§cНет блока!')
    ctx.reply(`§b► §f${block.typeId.replace('minecraft:', '')}\n${util.inspect(block.permutation.getAllStates())}`)
  })

root
  .overload('p')
  .setDescription('Выдает все states блока по локации')
  .location('location', true)
  .executes((ctx, location) => {
    const l = Vector.floor(location)
    const block = ctx.player.dimension.getBlock(l)
    if (!block) return ctx.reply('§cНет блока!')
    ctx.reply(util.inspect(block.permutation.getAllStates()))
  })

root
  .overload('r')
  .setDescription('Выдает наклон головы')
  .executes(ctx => {
    ctx.reply(`§a► §f${ctx.player.getRotation().x} ${ctx.player.getRotation().y}`)
  })
