import { world } from '@minecraft/server'

const name = new Command({
  name: 'name',
  description: 'Меняет имя',
  role: 'admin',
})

name
  .literal({ name: 'set' })
  .string('new name')
  .executes((ctx, newname) => {
    ctx.sender.nameTag = newname
  })

const reset = name.literal({ name: 'reset' }).executes(ctx => {
  ctx.sender.nameTag = ctx.sender.name
})

reset.literal({ name: 'all' }).executes(() => {
  for (const player of world.getPlayers()) player.nameTag = player.name
})
