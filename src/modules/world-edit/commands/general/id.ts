import {} from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Vec, inspect } from 'lib'

const root = new Command('id').setDescription('Выдает айди').setPermissions('builder').setGroup('we')

root.executes(ctx => {
  const item = ctx.player.mainhand()
  if (!item.typeId) return ctx.error('Нет предмета!')
  let message = `§b► §f${item.typeId.replace('minecraft:', '')} ${item.nameTag ? `(${item.nameTag}) ` : ''}`
  if (item.nameTag) message += ` (${item.nameTag})`
  if (!item.isStackable && item.getDynamicPropertyIds().length) {
    message +=
      '\nDynamicProperties ' +
      inspect(Object.fromEntries(item.getDynamicPropertyIds().map(e => [e, item.getDynamicProperty(e)])))
  }
  ctx.reply(message)
})

root
  .overload('l')
  .setDescription('Выдает id блока по локации')
  .location('location', true)
  .executes((ctx, location = ctx.player.location) => {
    const l = Vec.floor(location)

    const block = ctx.player.dimension.getBlock(l)
    if (!block) return ctx.reply('§cНет блока!')
    ctx.reply(`§b► §f${block.typeId.replace('minecraft:', '')}\n${inspect(block.permutation.getAllStates())}`)
  })

root
  .overload('p')
  .setDescription('Выдает все states блока по локации')
  .location('location', true)
  .executes((ctx, location = ctx.player.location) => {
    const l = Vec.floor(location)
    const block = ctx.player.dimension.getBlock(l)
    if (!block) return ctx.reply('§cНет блока!')
    ctx.reply(inspect(block.permutation.getAllStates()))
  })

root
  .overload('r')
  .setDescription('Выдает наклон головы')
  .executes(ctx => {
    ctx.reply(`§a► §f${ctx.player.getRotation().x} ${ctx.player.getRotation().y}`)
  })

root
  .overload('e')
  .setDescription('Выдает стату ближайшего энтити')
  .executes(ctx => {
    const entity = ctx.player.dimension.getEntities({
      excludeTags: [MinecraftEntityTypes.Player],
      location: ctx.player.location,
      closest: 1,
    })
    if (!entity[0]) return ctx.error('No entity found!')

    let message = entity[0].typeId
    for (const c of entity[0].getComponents()) {
      message +=
        '\n' +
        inspect(
          Object.map(c as unknown as Record<string, unknown>, (k, v) =>
            k === 'entity' || k === 'isValid' ? false : [k, v],
          ),
        )
    }
    ctx.reply(message)
  })
