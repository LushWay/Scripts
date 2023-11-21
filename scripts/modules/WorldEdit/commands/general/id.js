import { Vector } from '@minecraft/server'
import { util } from 'smapi.js'

const root = new Command({
  name: 'id',
  description: 'Выдает айди',
  role: 'builder',
  type: 'we',
})

root.executes(ctx => {
  const item = ctx.sender.mainhand()
  if (!item) return ctx.reply('§cВ руке нет предмета!')

  ctx.reply(
    `§b► §f${item?.typeId?.replace('minecraft:', '')} ${
      item?.nameTag ? `(${item?.nameTag}) ` : ''
    }`
  )
})

root
  .literal({ name: 'l', description: 'Выдает id блока по локации' })
  .location('location', true)
  .executes((ctx, location) => {
    const l = Vector.floor(location)
    const block = ctx.sender.dimension.getBlock(l)
    if (!block) return ctx.reply('§cНет блока!')
    ctx.reply(
      `§b► §f${block.typeId.replace('minecraft:', '')}\n${util.inspect(
        block.permutation.getAllStates()
      )}`
    )
  })

root
  .literal({ name: 'p', description: 'Выдает все states блока по локации' })
  .location('location', true)
  .executes((ctx, location) => {
    const l = Vector.floor(location)
    const block = ctx.sender.dimension.getBlock(l)
    if (!block) return ctx.reply('§cНет блока!')
    ctx.reply(util.inspect(block.permutation.getAllStates()))
  })

root
  .literal({ name: 'r', description: 'Выдает наклон головы' })
  .executes(ctx => {
    ctx.reply(
      `§a► §f${ctx.sender.getRotation().x} ${ctx.sender.getRotation().y}`
    )
  })
